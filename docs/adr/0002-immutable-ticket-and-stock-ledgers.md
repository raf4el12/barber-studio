# Immutable Ticket and Stock Ledgers with Frozen Financial Snapshots

We store sales lines, inventory changes, and loyalty transactions as append-only immutable ledgers, snapshotting unit prices, taxes, and computed commissions directly onto `TicketItem` at creation time. We rejected dynamic historical recalculation because catalog prices, tax percentages, and staff commission rules change over time; recalculating historical sales dynamically would corrupt past financial reports, shift closings (Z-Reports), and tax filings.
