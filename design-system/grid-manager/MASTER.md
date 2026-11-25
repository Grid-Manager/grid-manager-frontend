# Grid Manager — Design system

## Direção aprovada

Editorial esportivo com linguagem de automobilismo. O portal combina manchetes expressivas, fotografia de pista identificada como ilustrativa, dados publicados pela organização e superfícies claras e grafite. O painel mantém a marca e a tipografia, com densidade mais alta para tarefas operacionais.

Use os tokens em `tokens.json` e `tokens.css`. Os arquivos de fonte locais e suas licenças ficam em `public/fonts`.

## Fundamentos

### Cor

| Uso | Token | Valor |
|---|---|---|
| Fundo principal | `--color-background` | `#F4F3EF` |
| Texto principal | `--color-foreground` | `#111315` |
| Ação vermelha e texto pequeno | `--color-secondary` | `#C92E26` |
| Vermelho gráfico em títulos e marcas | `--color-accent` | `#E03A30` |
| Fundo alternativo | `--color-paper-alt` | `#E9E8E2` |
| Superfície clara | `--color-paper-bright` | `#F8F7F3` |
| Texto secundário | `--color-muted-foreground` | `#62676A` |
| Regra clara | `--color-editorial-line` | `rgba(17, 19, 21, .16)` |
| Regra em fundo escuro | `--color-editorial-line-dark` | `rgba(244, 243, 239, .20)` |

Use texto branco em botões `#C92E26`. Reserve `#E03A30` para elementos gráficos e texto de exibição grande; não o use como texto pequeno sobre fundo claro.

### Tipografia

- **Space Grotesk:** manchetes, títulos, nomes e informação de destaque.
- **Inter:** leitura corrida, navegação, formulários e controles.
- **IBM Plex Mono:** datas, números de piloto, posição, pontos e metadados técnicos.
- As fontes são servidas localmente. Não adicione uma dependência de carregamento remoto.

### Espaçamento e largura

- Use `--space-xs` a `--space-3xl` para a escala de 4 a 64 px.
- A largura máxima editorial é `--layout-content-width` (1320 px).
- Seções públicas usam respiro amplo; listas e o painel usam agrupamentos compactos com separadores finos.
- Cantos retos ou discretos. Evite sombras e cartões arredondados como padrão.

## Composição e componentes

### Portal público

- A homepage começa com manchete e fotografia lado a lado no desktop. No celular, a imagem ocupa o fundo do hero e o texto fica no primeiro plano.
- Alterne listas editoriais, superfícies grafite, tabelas de classificação e agrupamentos de dados. Não repita a mesma grade de cartões em todas as seções.
- Dê prioridade visual à agenda, categorias, classificação por temporada e pilotos.
- Notícias só aparecem quando existir uma fonte editorial. Não invente manchetes, resultados, tempos ou estados ao vivo.
- Uma imagem de referência não representa uma corrida ou equipe do Grid Manager. Preserve sua identificação e atribuição.

### Painel administrativo

- Use uma lateral de navegação estável, títulos de seção claros e conteúdo operacional em painéis simples.
- Tabelas devem permanecer legíveis em telas estreitas e permitir localizar as ações de cada linha.
- Agrupe formulários por tarefa, mantenha rótulos visíveis e mostre estados de sucesso, erro, carregamento e ausência de dados.
- A interface consome os contratos existentes. Alterações de regra ou de API pertencem ao backend.

### Ações e movimento

- Botão primário: fundo `--color-secondary`, texto branco e seta discreta.
- Links têm estados de hover e foco visíveis. A navegação atual recebe indicação persistente.
- Use transições curtas (150–200 ms); não anime conteúdo necessário para leitura nem esconda conteúdo até executar JavaScript.
- Respeite `prefers-reduced-motion`.

## Acessibilidade e responsividade

- Alvo mínimo de contraste de 4.5:1 para texto normal.
- Mantenha o link de salto para o conteúdo, navegação por teclado, nomes acessíveis e foco visível.
- Estados da API devem ser explicados em linguagem direta; diferencie dados indisponíveis de uma lista vazia.
- Revise em 320, 390, 768, 1024 e 1440 px. Não permita rolagem horizontal nem conteúdo coberto pela navegação.

## Integração e dados

- `API_BASE_URL` é lido no servidor. O portal não replica regras de pontuação.
- A classificação parcial da homepage soma os pontos que a API publicou para corridas da temporada selecionada. Pontos iguais continuam empatados.
- O Quick Grid permanece separado. Consulte `docs/quick-grid-integration.md` antes de propor contratos de integração.
