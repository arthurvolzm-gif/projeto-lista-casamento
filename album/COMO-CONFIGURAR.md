# Álbum dos convidados (order bump 2): como ligar

Usa o mesmo Supabase e o mesmo login do convite.

1. No Supabase, abra **SQL Editor → New query**, cole todo o arquivo `album/album.sql` e clique em **Run**.
2. Em **Authentication → URL Configuration → Redirect URLs**, adicione `https://meuchecklove.vercel.app/album/painel`.

## Endereços
- Painel dos noivos: `/album/painel` (QR Code, link, personalização, fotos, baixar tudo)
- Página do convidado: `/a/<link-do-album>` (sem login, sem app)
- Cards para as mesas: `/album/cards` (3 modelos, com ou sem missões)

## Regras
- As fotos ficam guardadas por 1 ano a partir da criação do álbum.
- Arquivos de até 50 MB (fotos e vídeos), até 5.000 arquivos por álbum.
- O casal pode fechar o álbum, esconder a galeria dos convidados e apagar qualquer arquivo.
