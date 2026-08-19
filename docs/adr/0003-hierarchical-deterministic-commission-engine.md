# Hierarchical Deterministic Commission Resolution Engine

We resolve barber commissions through a deterministic specificity hierarchy (Item/Category/Barber/Branch rule with date validity and priority tie-breaking -> Barber override -> Global/Branch setting fallback) as a pure computational module. We rejected embedding commission formulas inside database triggers or ad-hoc controller queries because commission policies undergo frequent promotional variations, requiring isolated unit-testability, audit predictability, and instant preview capabilities without side effects.
