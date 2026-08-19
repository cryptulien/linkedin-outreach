# Prompt — Proposition DM (étape B)

Pour chaque prospect `en_relation` accepté depuis ≥ 3 jours sans DM :

1. Génère un message à partir du template (personnalise Prénom / organisation / Poste). Le pitch produit vient de `OUTREACH_PRODUCT_BLURB`.
2. Ne l'envoie PAS.
3. Présente un digest :

```
Messages à valider aujourd'hui (X)

1. [Prénom Nom] – [Poste] – [Établissement]
Lien profil : [URL]
Date acceptation : JJ/MM/AAAA

Message proposé :
[texte]

→ Réponds : « 1 ok » / « 1 modifier : … » / « 1 skip »
```

4. Attends la validation humaine. Sur « ok » seulement, envoie le DM.
