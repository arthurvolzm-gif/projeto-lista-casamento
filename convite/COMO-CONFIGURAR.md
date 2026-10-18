# Convite digital CheckLove: como colocar no ar

## Endereços
- **Editor (a noiva cria o convite, com login):** `https://SEU-DOMINIO/convite/editor`
- **Convite para os convidados:** `https://SEU-DOMINIO/c/nome-do-convite` (o editor mostra o link pronto, com botão de copiar e de enviar no WhatsApp)

Sem configurar nada, o editor funciona em **modo demonstração**: salva só no navegador e o link não abre para outras pessoas. Para funcionar de verdade, siga os passos abaixo uma vez só.

## 1. Criar o projeto no Supabase (grátis)
1. Entre em https://supabase.com e crie uma conta.
2. Clique em **New project**, dê um nome (ex.: `checklove`), crie uma senha do banco e escolha a região **South America (São Paulo)**.
3. Espere o projeto ficar pronto (1 a 2 minutos).

## 2. Criar as tabelas
1. No menu da esquerda, abra **SQL Editor** e clique em **New query**.
2. Copie todo o conteúdo de `convite/supabase.sql`, cole e clique em **Run**.
3. Deve aparecer "Success". Isso cria os convites, as confirmações de presença, as regras de segurança e o local das fotos.

## 3. Configurar o login
1. Abra **Authentication → URL Configuration**.
2. Em **Site URL**, coloque o endereço do site (ex.: `https://checklove.com.br`).
3. Em **Redirect URLs**, adicione `https://SEU-DOMINIO/convite/editor`.
4. Em **Authentication → Providers → Email**, deixe "Email" ligado. Se quiser que a pessoa entre sem confirmar o e-mail, desligue **Confirm email**.

## 4. Colar as chaves no site
1. Abra **Project Settings → API**.
2. Copie a **Project URL** e a chave **anon public**.
3. Me passe as duas (ou cole em `convite/config.js` nos campos `SUPABASE_URL` e `SUPABASE_ANON_KEY`).
4. Nunca use a chave **service_role** no site.

Depois do próximo deploy, o editor passa a pedir login e o link do convite funciona para qualquer pessoa.

## Quem pode criar convite
Hoje qualquer pessoa que criar conta consegue usar o editor. Para liberar só para compradoras, o próximo passo é ligar o webhook da plataforma de pagamento a uma lista de e-mails liberados (igual ao que foi feito no app do ENEM).
