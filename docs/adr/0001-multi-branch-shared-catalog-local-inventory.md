# Multi-Branch with Shared Catalog and Local Inventory

We structure the system as a single-organization multi-branch architecture where catalog items (services and products) are globally defined, while stock quantities, cash registers, queue entries, and sales transactions are strictly isolated per branch. We chose this over a multi-tenant or branch-isolated catalog model because branding, pricing strategy, and service menus are unified across all branches under a single owner, while inventory physical logistics and daily cash registers remain strictly local to each shop.
