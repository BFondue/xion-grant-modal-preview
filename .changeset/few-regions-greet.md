---
"abstraxion-dashboard": minor
---

Restore the ability to grant MsgSend to unblock Blazeswap

This change temporarily comments out the code that was preventing the use of generic MsgSend authorization in the treasury contract query function. Previously, the code was throwing an error when encountering "/cosmos.bank.v1beta1.MsgSend" message types, which was blocking Blazeswap functionality. This is a temporary solution.
