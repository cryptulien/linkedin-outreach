# Twenty statuses — contract

| Status | Description | Related fields |
|--------|-------------|----------------|
| `non_invite` | Initial FIFO pool | — |
| `invite_envoye` | LinkedIn invitation sent (no note) | `inviteSentAt` |
| `en_relation` | Invitation accepted | `acceptedAt` |
| `message_a_valider` | DM draft proposed, waiting for human | `messageDraft` |
| `message_envoye` | DM validated and sent | `messageSentAt`, `messageContent` |
| `alerting_profil_non_trouve` | LinkedIn profile not identifiable | — |
| `alerting_autre` | Other blocking error | — |

Processing order: **FIFO** by list / seed order.

DM eligibility: `en_relation` with `acceptedAt` ≥ 3 days, not yet `message_envoye`.
