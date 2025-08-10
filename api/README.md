# Stock Insights API

This is the FastAPI backend for the Stock Insights application.

## Environment Setup

1. Create a `.env` file in the `api` directory with your API keys:

```env
FMP_API_KEY=your_fmp_api_key_here
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the API:

```bash
uvicorn api:app --reload
```

## API Keys Required

- **FMP_API_KEY**: Financial Modeling Prep API key for stock data

## Security Notes

- Never commit API keys to version control
- The `.env` file is already in `.gitignore`
- API keys are loaded from environment variables at runtime
