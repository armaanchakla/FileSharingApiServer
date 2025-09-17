# FileSharingApiServer


## Run


1. `npm install`
2. Create an `.env` file based on `.env.example`. Ensure `FOLDER` is an absolute path and exists (the server will create subfolders inside it).
3. `npm start`


## Tests


`npm test` runs unit and integration tests (uses temporary folders).


## API


- `POST /files` — multipart/form-data file upload. Response JSON: `{ publicKey, privateKey }`.
- `GET /files/:publicKey` — download file by public key. Returns file stream with correct Content-Type.
- `DELETE /files/:privateKey` — deletes file by private key. Returns `{ success: true, privateKey }`.


---


For more details see source files in `/src`.