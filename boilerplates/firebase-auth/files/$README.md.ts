import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  //language=Markdown
  const todo = `
## *Firebase*
- You first need to **[Create a Firebase project](https://firebase.google.com/docs/web/setup#create-project)**.
- Then register your app in the firebase console. **[Register your app](https://firebase.google.com/docs/web/setup#register-app)**
- Copy Your web app's Firebase configuration and paste in \`/pages/+firebaseApp.ts\` Example :
\`\`\`ts
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
\`\`\`
- Download Your Firebase service account from [Your Firebase Project Settings > Service accounts](https://console.firebase.google.com/u/0/project/{firebase-project-id}/settings/serviceaccounts/adminsdk)
- Rename to service-account.json and move it to folder \`/firebase/\`.
- Read more about Firebase Auth at official [firebase auth docs](https://firebase.google.com/docs/auth)
- Read FirebaseUI at [firebaseui-web docs](https://github.com/firebase/firebaseui-web?tab=readme-ov-file#using-firebaseui-for-authentication)
`;

  content.addTodo(todo);

  return content.finalize();
}
