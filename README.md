# Iggy Social Frontent (Nuxt) on Google App Engine (GAE)

Iggy Social starter template which uses the following stack:

- Google App Engine (GAE)
- Nuxt
- Wagmi
- Farcaster (optional, suitable for mini apps)
- Bootstrap

## NPM install

```bash
nvm use 22 # make sure to use NodeJS v22

npm i
```

## Supported network

Set the supported network in the wagmi.ts file in the root folder. It should be only 1 supported network.

## Localhost env vars

On localhost create a `.env` file by duplicating or renaming the `.env.example` file. Enter the needed variable values.

## GAE env vars

Go to Datastore on the Cloud Console and create the `EnvVar` kind. In the `EnvVar` kind create a new entity with key title `envkey` and text `FILE_UPLOAD_SERVICE`, and value title `envval` with the value of `server`.

Also create other env vars, as listed in the `.env.example` file.

## How to set up Google App Engine & Cloud Build

- Create App Engine app
  - Select region (e.g. europe-west).
  - This will also automatically create a Datastore database (it may take a few minutes).
- Enable the following APIs:
  - Cloud Build API
  - Cloud Tasks API
  - App Engine Admin API
  - Cloud Scheduler API
  - Secret Manager API 
- Go to IAM:
  - Check the `Include Google-provided role grants` checkbox
  - Then give the `Cloud Scheduler Admin` role to:
    - the Cloud Build service account
    - the Default App Engine service account 
- Connect your GitHub repo with Google Cloud Repositories:
  - Go to repositories: https://console.cloud.google.com/cloud-build/repositories/2nd-gen 
  - Click on "Create host connection" and connect your GitHub (org or personal account)
  - Click on "Link repositories" and select your repo on GitHub
- Open the Cloud Build Permissions page:
  - choose the service account **without** numbers, and set it as **preferred service account**
  - set the status of the App Engine Admin role to Enabled 
  - set the status of the Service Account User role to Enabled
- Then go to the "Triggers" page:
  - click on "Create trigger"
  - Give it a name `Commit`, select 2nd Gen and select your repo
  - In the **branch** input, make sure to select the correct branch (e.g. `^main$`)
  - Run the trigger and check its logs in History
  - If you get an error, add the appropriate user to IAM
- Go to Cloud Tasks:
  - Create the `default` queue
  - Make sure the region is the same as you selected for your GAE app (e.g. europe-west1)
  - Leave everything else the default

## Farcaster Mini App setup

Set Farcaster data in these files:

- `/public/well-known/farcaster.json`
- `app.vue`: edit the Meta tag with `name="fc:miniapp"` if needed, for example the splash bg color
- `/pages/about.vue`: example of a custom Farcaster Meta tag (add custom meta tags on other pages too)

## Cloudflare Tunnel for Farcaster testing

1. Install cloudflared: `npm install -g cloudflared` (or download from [cloudflare.com](https://cloudflare.com))
2. Run the tunnel: `cloudflared tunnel --url http://localhost:3000`
3. Use the generated public URL for Farcaster testing

## Supported tokens

For token swap and sending tokens, edit the `tokens.json` and `wrappedNativeTokens.json` files in the `data/` folder.

## How to connect your Safe to the app

0. Make sure you have WalletConnect project ID in environment variables (check example.env to see how)
1. In the app, click on the "Connect Wallet" button and select "WalletConnect"
2. A small modal will appear. Click on the copy icon (two overlapping squares) to copy the WalletConnect URI
3. Go to https://app.safe.global/ and open your Safe
4. In the navigation bar, click on the "WalletConnect" icon
5. In the modal that appears, enter the WalletConnect URI that you copied in the previous step
6. Wait for the Safe to connect
7. You should now see your Safe address in the app

## WalletConnect

If you want WalletConnect support, make sure to copy `.env.example` in to `.env` and enter your WalletConnect project ID into `VITE_WC_PROJECT_ID`.

If you don't want to use WC, then you can remove it from `wagmi.ts` and `/components/connect/ConnectWalletButton.vue`.
