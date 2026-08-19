# Statuts Twenty — contrat

| Statut | Description | Champs associés |
|--------|-------------|-----------------|
| `non_invite` | Pool FIFO initial | — |
| `invite_envoye` | Invitation LinkedIn envoyée (sans note) | `inviteSentAt` |
| `en_relation` | Invitation acceptée | `acceptedAt` |
| `message_a_valider` | Draft DM proposé, en attente humain | `messageDraft` |
| `message_envoye` | DM validé et envoyé | `messageSentAt`, `messageContent` |
| `alerting_profil_non_trouve` | Profil LinkedIn non identifiable | — |
| `alerting_autre` | Autre erreur bloquante | — |

Ordre de traitement : **FIFO** selon l’ordre de la liste / seed.

Éligibilité DM : `en_relation` avec `acceptedAt` ≥ 3 jours, pas encore `message_envoye`.
