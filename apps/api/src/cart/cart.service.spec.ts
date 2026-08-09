import { BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';

describe('CartService.addItem — releaseDate ("coming soon") guard', () => {
  let service: CartService;

  const cart = {
    id: 'cart-1',
    userId: 'user-1',
    sessionToken: null,
    savedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const product = (releaseDate: Date | null) => ({
    id: 'p-1',
    storeId: 'store-1',
    categoryId: 'cat-1',
    brandId: null,
    name: 'Prod',
    slug: 'prod',
    sku: 'SKU-1',
    description: null,
    price: 10,
    salePrice: null,
    stock: 5,
    lowStockThreshold: 5,
    releaseDate,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [],
  });

  const prismaMock = {
    db: {
      cart: { findUnique: jest.fn(), create: jest.fn() },
      product: { findFirst: jest.fn() },
      productVariant: { findFirst: jest.fn() },
      cartItem: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CartService(prismaMock as any);
    prismaMock.db.cart.findUnique.mockResolvedValue(cart);
  });

  it('rejects adding a product whose release date is in the future', async () => {
    prismaMock.db.product.findFirst.mockResolvedValue(product(new Date('2099-01-01T00:00:00.000Z')));

    await expect(service.addItem('user-1', undefined, { productId: 'p-1', quantity: 1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaMock.db.cartItem.create).not.toHaveBeenCalled();
  });

  it('allows adding a product once the release date has passed', async () => {
    prismaMock.db.product.findFirst.mockResolvedValue(product(new Date('2020-01-01T00:00:00.000Z')));
    prismaMock.db.cartItem.findFirst.mockResolvedValue(null);
    prismaMock.db.cartItem.create.mockResolvedValue({ id: 'ci-1' });
    prismaMock.db.cartItem.findMany.mockResolvedValue([]);

    await expect(service.addItem('user-1', undefined, { productId: 'p-1', quantity: 1 })).resolves.toEqual({
      id: 'cart-1',
      items: [],
      itemCount: 0,
      subtotal: 0,
      savedCount: 0,
    });
    expect(prismaMock.db.cartItem.create).toHaveBeenCalled();
  });

  it('allows adding a product with no release date (available immediately)', async () => {
    prismaMock.db.product.findFirst.mockResolvedValue(product(null));
    prismaMock.db.cartItem.findFirst.mockResolvedValue(null);
    prismaMock.db.cartItem.create.mockResolvedValue({ id: 'ci-1' });
    prismaMock.db.cartItem.findMany.mockResolvedValue([]);

    await expect(service.addItem('user-1', undefined, { productId: 'p-1', quantity: 1 })).resolves.toEqual({
      id: 'cart-1',
      items: [],
      itemCount: 0,
      subtotal: 0,
      savedCount: 0,
    });
  });
});