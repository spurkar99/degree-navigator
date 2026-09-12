# Publish Degree Navigator with GitHub Pages

## 1. Create the repository

1. Sign in to GitHub.
2. Select **New repository**.
3. Set the repository name to `degree-navigator`.
4. Choose **Public** if you want the source code to be visible as part of your portfolio.
5. Do not add a README, .gitignore or license; they are already included here.
6. Select **Create repository**.

## 2. Upload the project

The GitHub website does not accept a ZIP as a deployable project. Extract the ZIP first.

1. Open the new, empty repository.
2. Select **uploading an existing file**.
3. Drag the extracted project files and folders into the upload area.
4. Confirm that these items are present:
   - `.github/workflows/deploy-pages.yml`
   - `src/`
   - `index.html`
   - `package.json`
   - `package-lock.json`
   - `vite.config.ts`
5. Enter a commit message such as `Initial Degree Navigator release`.
6. Select **Commit changes**.

If the browser upload does not preserve the hidden `.github` folder, create
`.github/workflows/deploy-pages.yml` through GitHub's **Add file → Create new file**
screen and paste the supplied workflow into it.

## 3. Enable GitHub Pages

1. In the repository, open **Settings**.
2. In the left sidebar, open **Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Open the repository's **Actions** tab.
5. Select the **Deploy Degree Navigator** workflow.
6. Wait for both the build and deploy jobs to become green.

## 4. Open the public site

The URL will normally be:

`https://YOUR-GITHUB-USERNAME.github.io/degree-navigator/`

GitHub also shows the exact URL on the repository's Pages settings screen.

## Updating the site later

Upload or commit changed files to the `main` branch. The workflow publishes the
new version automatically.

For the v0.2 ZIP:

1. Extract the ZIP on your computer.
2. Open the extracted `degree-navigator-github` folder.
3. In the repository, select **Add file → Upload files**.
4. Drag the contents of the extracted folder into GitHub. Do not upload the ZIP itself.
5. Confirm that `src/App.tsx`, `src/lib/excel.ts`, `package.json`, and
   `package-lock.json` are included in the pending upload.
6. Commit with the message `Release Degree Navigator v0.2`.
7. Wait for **Deploy Degree Navigator** to turn green in the Actions tab.

The existing Pages workflow does not need to be recreated for this update.

## Common fixes

- **404 page:** Confirm Pages uses **GitHub Actions**, not “Deploy from a branch.”
- **Workflow missing:** Confirm the file exists at
  `.github/workflows/deploy-pages.yml`.
- **Blank page:** Confirm `vite.config.ts` still contains `base: "./"`.
- **Red workflow:** Open the failed job and inspect the first red build step.
