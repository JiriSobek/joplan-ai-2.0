# Pomocník pro individuální plány

Jednoduchá statická HTML/JS stránka, která:
- 📋 Umožňuje vložit text pečovatelek
- 📝 „Poradit“ – spustí prompt č. 1 a vypíše doporučení pod tlačítka
- ✍️ „Vylepšit“ – spustí prompt č. 2 a přepíše text
- ↩️ „Zpět“ – vrátí původní text před vylepšením
- 📋 „Kopírovat“ – uloží text do schránky

## Nastavení

1. Založ Azure OpenAI resource a vytvoř deployment (např. `gpt-35-turbo`).  
2. Poznamenej si **Endpoint**, **API Key** a **Deployment name**.

## Environment Variables

Vlož do **Vercel** nebo `.env` souboru tyto proměnné:
```
AZURE_ENDPOINT=https://<tvuj-resource>.openai.azure.com
AZURE_KEY=<tvuj-api-key>
AZURE_DEPLOY=<nazev-deploymentu>
```

## Deploy

1. GitHub: push této struktury do repozitáře.  
2. Vercel: Import project, nastav environment variables.  
3. Aplikace se nasadí automaticky.

Hotovo! 😊
