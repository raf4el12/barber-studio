# Barber Studio

Core domain model for a multi-branch barber shop and men's grooming business managing walk-in queues, point-of-sale transactions, commission calculations, local inventory, and customer loyalty.

## Language

### Organization & Staff

**Branch**:
A physical barber shop location operating under the central business organization.
_Avoid_: Store, shop, tenant, clinic

**Staff Member**:
An individual employed by the business with an assigned operational role and branch access scope.
_Avoid_: User, employee, worker

**Owner**:
The principal business administrator with full oversight and operational authority across all branches.
_Avoid_: Admin, superadmin, manager

**Barber**:
A grooming specialist who performs services on customers, receives customer tips, and earns commissions.
_Avoid_: Stylist, cutter, provider

**Cashier**:
A staff member responsible for operating the cash register, processing payments, and executing shift closings.
_Avoid_: Clerk, receptionist, teller

### Operations & Real-Time Queue

**Queue Entry**:
A discrete waiting position in a branch's service pipeline representing an awaiting or in-service customer.
_Avoid_: Appointment, booking, ticket, turn

**General Queue**:
The pool of waiting customers awaiting the next available barber in a branch.
_Avoid_: Common line, unassigned queue, waiting room

**Assigned Queue**:
A waiting line of customers who have explicitly requested a designated barber.
_Avoid_: Personal queue, barber appointment

**Walk-in**:
A customer who arrives at a branch without prior scheduling.
_Avoid_: Guest, anonymous customer, passerby

**Turn Transition**:
The lifecycle progression of a queue entry through waiting, in-service, completed, or cancelled states.
_Avoid_: Status change, queue mutation

### Catalog & Inventory

**Service**:
A grooming or styling procedure delivered by a barber.
_Avoid_: Treatment, appointment, task

**Service Category**:
A logical classification grouping related grooming procedures.
_Avoid_: Department, service type, tag

**Product**:
A physical retail item or consumable available for purchase at a branch.
_Avoid_: Good, merchandise, article, item

**Stock**:
The current countable quantity of a product physically available at a specific branch.
_Avoid_: Quantity, availability, inventory count

**Stock Movement**:
An immutable ledger entry recording the addition, deduction, transfer, or adjustment of product stock at a branch.
_Avoid_: Inventory change, stock update, stock log

### Point of Sale (POS) & Billing

**Ticket**:
A commercial sales document capturing rendered services, sold products, applied discounts, taxes, and earned barber commissions for a customer visit.
_Avoid_: Receipt, invoice, order, bill, sale

**Ticket Item**:
An individual line entry in a ticket snapshotting the agreed price, tax, discount, and computed commission at the time of sale creation.
_Avoid_: Line item, detail, sale item, order item

**Split Payment**:
A settlement method allowing a ticket's total balance to be divided across multiple payment methods.
_Avoid_: Partial payment, multi-tender, mixed payment

**Payment Method**:
An accepted medium of financial exchange, such as cash, mobile digital wallet, or payment card.
_Avoid_: Tender type, payment gateway, payment mode

**Tip**:
An optional gratuity paid by the customer directly attributed to the serving barber.
_Avoid_: Bonus, surcharge, fee

**Voided Ticket**:
A finalized ticket that has been formally nullified, requiring financial reversal and stock restoration.
_Avoid_: Deleted ticket, cancelled order, refunded ticket

### Cash Flow & Register Management

**Cash Register**:
A dedicated physical cash drawer session operated by a cashier during a work shift.
_Avoid_: Shift, drawer, register, till, cash box

**Opening Fund**:
The initial base amount of cash placed in the cash register at the start of a shift.
_Avoid_: Starting cash, petty cash, base float

**Cash Count (Arqueo)**:
The physical reconciliation of cash in the drawer against expected recorded cash sales at shift closure.
_Avoid_: Cash audit, drawer count, till balancing

**Z-Report**:
The consolidated shift closing report summarizing total sales by payment method, net revenue, taxes, cash discrepancies, and barber payout liabilities.
_Avoid_: Daily summary, closing report, shift audit, balance sheet

### Commissions & Compensation

**Commission Rule**:
A business policy defining the payout rate (percentage or fixed amount) earned by a barber for performing a service or selling a product.
_Avoid_: Incentive, bonus rule, commission tier

**Commission Override**:
A barber-specific baseline commission percentage that supercedes the global or branch default.
_Avoid_: Custom rate, barber cut, personal split

**Commission Snapshot**:
An immutable record of the exact commission rate and monetary payout frozen on each ticket item at the moment of ticket creation.
_Avoid_: Commission record, frozen payout, saved commission

**Barber Payout**:
The total compensation owed to a barber for a given time period, comprising earned item commissions plus received tips.
_Avoid_: Barber salary, payout total, payroll line

### Customers & Loyalty

**Customer**:
An individual client receiving grooming services or purchasing retail products.
_Avoid_: Client, buyer, patron, account

**Loyalty Point**:
A unit of reward currency earned by a customer based on ticket spending.
_Avoid_: Reward point, bonus credit, coin

**Loyalty Ledger**:
An append-only sequence of transactions recording points earned from ticket purchases and points deducted for rewards.
_Avoid_: Points balance, loyalty history, points account

**Reward Redemption**:
The exchange of accrued loyalty points for a commercial discount or complimentary service on a ticket.
_Avoid_: Point claim, cashback, loyalty discount

### Audit & Compliance

**Audit Entry**:
An immutable chronological record of a critical business action, capturing the acting staff member, branch scope, action type, and state diff.
_Avoid_: System log, activity, event trace
