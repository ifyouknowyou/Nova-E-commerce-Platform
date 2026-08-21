import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { type Cart, type CartItem, type Prisma } from '@prisma/client';

type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: {
    product: { include: { images: { orderBy: { sortOrder: 'asc' }; take: 1 } } };
    variant: true;
  };
}>;
import { mediaUrl } from '../common/media-url';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

export interface CartItemResponse {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  priceSnapshot: number;
  savedForLater: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    stock: number;
    effectivePrice: number;
  };
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  itemCount: number;
  subtotal: number;
  savedCount: number;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve the cart for a user (if authenticated) or a guest session token. */
  async getCart(userId: string | undefined, sessionToken: string | undefined): Promise<CartResponse> {
    const cart = await this.findCart(userId, sessionToken);
    if (!cart) {
      return { id: '', items: [], itemCount: 0, subtotal: 0, savedCount: 0 };
    }
    return this.toResponse(cart);
  }

  async addItem(
    userId: string | undefined,
    sessionToken: string | undefined,
    dto: AddCartItemDto,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, sessionToken);

    const product = await this.prisma.db.product.findFirst({
      where: { id: dto.productId, status: 'APPROVED', visibility: 'PUBLIC', deletedAt: null },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Not-yet-released products ("coming soon") cannot be added to the cart.
    // Guarded server-side so the UI is not the only gate.
    if (product.releaseDate && product.releaseDate > new Date()) {
      throw new BadRequestException(
        `This product is not yet available — releases ${product.releaseDate.toISOString()}`,
      );
    }

    // Resolve + validate the variant up front: it must exist, be active, and
    // belong to THIS product (otherwise a foreign variant would silently
    // mis-price the line or trigger an unhandled FK 500).
    let variant: { priceDelta: unknown; stock: number } | null = null;
    if (dto.variantId) {
      variant = await this.prisma.db.productVariant.findFirst({
        where: { id: dto.variantId, productId: product.id, isActive: true },
        select: { priceDelta: true, stock: true },
      });
      if (!variant) throw new BadRequestException('Variant not found for this product');
    }

    const availableStock = variant ? variant.stock : product.stock;
    if (availableStock < dto.quantity) {
      throw new BadRequestException(`Only ${availableStock} in stock`);
    }

    const unitPrice = Number(product.salePrice ?? product.price) + Number(variant?.priceDelta ?? 0);
    const existing = await this.prisma.db.cartItem.findFirst({
      where: { cartId: cart.id, productId: product.id, variantId: dto.variantId ?? null },
    });

    if (existing) {
      const quantity = existing.quantity + dto.quantity;
      if (quantity > availableStock) {
        throw new BadRequestException(`Only ${availableStock} in stock`);
      }
      await this.prisma.db.cartItem.update({
        where: { id: existing.id },
        data: { quantity, priceSnapshot: unitPrice },
      });
    } else {
      await this.prisma.db.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          variantId: dto.variantId,
          quantity: dto.quantity,
          priceSnapshot: unitPrice,
        },
      });
    }

    return this.toResponse(cart);
  }

  async updateItem(
    userId: string | undefined,
    sessionToken: string | undefined,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, sessionToken);
    const item = await this.prisma.db.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');

    const data: Partial<Pick<CartItem, 'quantity' | 'savedForLater'>> = {};
    if (dto.savedForLater !== undefined) data.savedForLater = dto.savedForLater;
    if (dto.quantity !== undefined) {
      if (dto.quantity < 1) throw new BadRequestException('Quantity must be at least 1');
      data.quantity = dto.quantity;
    }
    await this.prisma.db.cartItem.update({ where: { id: item.id }, data });

    return this.toResponse(cart);
  }

  async removeItem(
    userId: string | undefined,
    sessionToken: string | undefined,
    itemId: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, sessionToken);
    const item = await this.prisma.db.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.prisma.db.cartItem.delete({ where: { id: item.id } });
    return this.toResponse(cart);
  }

  /** Move a guest cart into the user's cart after login/registration. */
  async mergeGuestCart(userId: string, sessionToken: string): Promise<CartResponse> {
    const guestCart = await this.prisma.db.cart.findUnique({ where: { sessionToken } });
    const userCart = await this.getOrCreateCart(userId, undefined);

    if (guestCart && guestCart.id !== userCart.id) {
      const guestItems = await this.prisma.db.cartItem.findMany({ where: { cartId: guestCart.id } });
      for (const item of guestItems) {
        const existing = await this.prisma.db.cartItem.findFirst({
          where: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId,
          },
        });
        if (existing) {
          await this.prisma.db.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
        } else {
          await this.prisma.db.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              priceSnapshot: item.priceSnapshot,
              savedForLater: item.savedForLater,
            },
          });
        }
      }
      await this.prisma.db.cart.delete({ where: { id: guestCart.id } });
    }

    return this.toResponse(userCart);
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async findCart(userId?: string, sessionToken?: string): Promise<Cart | null> {
    if (userId) {
      return this.prisma.db.cart.findUnique({ where: { userId } });
    }
    if (sessionToken) {
      return this.prisma.db.cart.findUnique({ where: { sessionToken } });
    }
    throw new UnauthorizedException('A session is required');
  }

  private async getOrCreateCart(userId?: string, sessionToken?: string): Promise<Cart> {
    const existing = await this.findCart(userId, sessionToken);
    if (existing) return existing;

    const data = userId
      ? { userId }
      : sessionToken
        ? { sessionToken }
        : (() => {
            throw new UnauthorizedException('A session is required');
          })();

    return this.prisma.db.cart.create({ data });
  }

  private async toResponse(cart: Cart): Promise<CartResponse> {
    const items = await this.prisma.db.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
        variant: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeItems = items.filter((item) => !item.savedForLater);
    const subtotal = activeItems.reduce(
      (sum, item) => sum + Number(item.priceSnapshot) * item.quantity,
      0,
    );

    return {
      id: cart.id,
      items: items.map((item) => this.toItem(item)),
      itemCount: activeItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      savedCount: items.filter((item) => item.savedForLater).length,
    };
  }

  private toItem(item: CartItemWithProduct): CartItemResponse {
    const product = item.product;
    const variant = item.variant;
    const price = Number(product.price);
    const salePrice = product.salePrice !== null ? Number(product.salePrice) : null;
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      priceSnapshot: Number(item.priceSnapshot),
      savedForLater: item.savedForLater,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images[0] ? mediaUrl(product.images[0].key) : null,
        stock: variant ? variant.stock : product.stock,
        effectivePrice: (salePrice ?? price) + Number(variant?.priceDelta ?? 0),
      },
    };
  }
}
