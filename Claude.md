DISTILLED_ECOMMERCE_AESTHETICS_PROMPT = """
<frontend_aesthetics>
You are designing the frontend of a premium, original enterprise e-commerce platform with three distinct experiences: Customer, Seller, and Admin.

Avoid generic "AI slop" e-commerce dashboards. The interface must feel intentionally art-directed, distinctive, premium, and context-aware. Do not copy Amazon, Shopify, Apple, or other existing products. Create an original visual identity.

Typography:
Choose distinctive, beautiful fonts that create a strong brand personality. Avoid generic Arial, Roboto, Inter, and default system fonts. Use a deliberate typography hierarchy for product names, prices, navigation, dashboards, analytics, and administrative interfaces. Typography should feel premium without sacrificing readability or accessibility.

Color & Theme:
Commit strongly to a cohesive visual identity using CSS variables/design tokens. Avoid timid palettes and generic purple-gradient aesthetics. Use a dominant visual language with carefully selected accent colors.

Customer:
Create a refined commerce-focused palette that makes products and pricing visually dominant.

Seller:
Use a sophisticated business-oriented visual language focused on analytics, inventory, revenue, and productivity.

Admin:
Use a clearly different command-center aesthetic with stronger contrast, deeper surfaces, controlled accent lighting, and high-information visual hierarchy.

Do not make Customer, Seller, and Admin look like the same dashboard with different menu items.

Motion:
Use motion intentionally rather than everywhere. Prioritize high-impact moments:

* Premium page-load reveal
* Product-card interactions
* Product gallery transitions
* Cart interactions
* Dashboard data transitions
* Sidebar navigation
* Modal and drawer transitions
* Account/profile interactions

Use CSS animations where practical and Motion for React when available. Prefer transform and opacity for performance. Respect prefers-reduced-motion.

Backgrounds:
Never default to empty solid backgrounds when atmosphere can improve the experience.

Create depth using:

* Layered gradients
* Subtle geometric patterns
* Soft lighting
* Grain/noise textures where appropriate
* Perspective
* Controlled shadows
* Glass surfaces
* Layered panels
* Contextual visual elements

Customer backgrounds should support product discovery.

Seller backgrounds should support focused business workflows.

Admin backgrounds should create a sophisticated command-center atmosphere without becoming distracting.

3D / Depth:
Use tasteful 3D-inspired design rather than excessive 3D effects.

Use:

* Perspective
* Layered cards
* Floating panels
* Depth-based shadows
* Subtle hover tilt
* Product elevation
* Spatial navigation
* Interactive visual hierarchy

Do not turn the application into a game or overuse WebGL/Three.js.

Performance and usability always take priority over visual effects.

Customer Experience:
Make shopping feel premium, visual, and effortless.

Prioritize:

* Product imagery
* Product discovery
* Search
* Categories
* Deals
* Product comparison
* Wishlist
* Cart
* Checkout
* Personalized recommendations

Seller Experience:
Make the dashboard feel like a premium business workspace.

Prioritize:

* Revenue
* Orders
* Inventory
* Products
* Store performance
* Analytics
* Reviews
* Productivity

Use sophisticated data visualization and dashboard composition without sacrificing readability.

Admin Experience:
Make the Admin interface visually distinct and authoritative.

Create a modern command-center feeling using:

* Layered information panels
* Advanced KPI cards
* Analytics
* System status
* User/seller management
* Orders
* Security
* Audit activity
* Platform health

Admin should feel more operational and information-dense than Customer or Seller.

Avoid:

* Generic SaaS dashboard templates
* Excessive rounded cards
* Identical cards everywhere
* Purple gradients on white
* Inter/Roboto/Arial defaults
* Predictable hero sections
* Generic stock-style illustrations
* Excessive glassmorphism
* Excessive neon
* Excessive shadows
* Unnecessary 3D
* Decorative animations that reduce usability
* Cookie-cutter Amazon/Shopify clones

Design Language:
Every component should feel intentionally designed for this specific commerce platform.

Create visual relationships between:

* Products
* Prices
* Categories
* Orders
* Customers
* Sellers
* Analytics
* Administration

Use strong hierarchy instead of decorating every element.

Use CSS variables/design tokens for:

* Colors
* Typography
* Spacing
* Radius
* Shadows
* Motion
* Elevation
* Light/dark themes

Responsive Design:
The aesthetic must remain strong across:

* Mobile
* Tablet
* Laptop
* Desktop
* Large displays

Do not simply shrink the desktop interface.

Adapt layouts, navigation, density, spacing, and interactions for each screen size.

Accessibility:
Visual creativity must never compromise usability.

Maintain:

* WCAG AA contrast
* Keyboard navigation
* Visible focus states
* Semantic HTML
* Accessible forms
* Screen-reader compatibility
* Reduced-motion support
* Clear interaction states

Final Principle:
Do not ask, "What does a typical e-commerce website look like?"

Ask:

"What visual identity would make this particular commerce platform feel memorable, premium, modern, and genuinely designed?"

Make deliberate, unexpected design choices while maintaining usability, accessibility, performance, and business clarity.

The result should look designed by a strong product design team—not generated from a generic UI template.
</frontend_aesthetics>
"""
