# Arquivo histórico do Grid Manager

O portal público carrega o arquivo local no modo de referência. Categorias cadastradas pela administração usam os dados do backend. O arquivo tem um recorte de 25 de novembro de 2026.

| Categoria | Primeiro ano no arquivo |
| --- | --- |
| Fórmula 1 | 2010 |
| Fórmula 2 e GP2 Series | 2010 |
| FIA Fórmula 3 | 2019 |
| IndyCar | 2010 |
| Fórmula E | 2014/15 |
| WEC Hypercar | 2021 |
| WEC LMGT3 | 2024 |
| MotoGP | 2010 |
| Moto2 | 2010 |
| Moto3 | 2012 |
| Stock Car Pro Series | 2010 |
| NASCAR Cup Series | 2010 |

As páginas de temporada indicam a fonte de cada calendário. As temporadas da F2 anteriores a 2017 aparecem como GP2 Series. As classes do WEC têm inscrições e classificações separadas. O arquivo da NASCAR cobre as corridas válidas para o campeonato.

O calendário exclui cancelamentos confirmados, incluindo as corridas principais da F2 e F3 em Melbourne em 2025 e a etapa de Bahrain do WEC de 2026, substituída por Monza. [FIA Fórmula 2](https://www.fiaformula2.com/en/latest/article/fia-formula-2-melbourne-feature-race-cancelled.1gAGpG8DBZRnDJLACS4VgK) · [FIA Fórmula 3](https://www.fiaformula3.com/en/latest/article/fia-formula-3-season-review-major-twists-in-the-title-race.4qxAEXzmRzoInXtgnNrylN) · [FIA WEC](https://www.fiawec.com/en/news/fia-wec-and-fia-confirm-venues-for-final-two-rounds-of-2026/13698)

- O calendário, a tabela por etapa e a classificação anual da Fórmula 1 foram adaptados do [F1DB v2026.21.0](https://github.com/f1db/f1db/releases/tag/v2026.21.0) sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- MotoGP, Moto2 e Moto3 têm classificação por prova para as 81 sessões disputadas em 2026 até 25 de novembro. São 20 GPs e 21 sprints na MotoGP, além de 20 corridas em cada uma das outras duas classes. Austrália teve apenas a sprint da MotoGP. O portal inclui abandonos e pilotos que não largaram quando constam na classificação. [Calendário e resultados da MotoGP](https://stats.motogp.com/en/gp-results) · [GP de Portugal de 2026](https://es.wikipedia.org/wiki/Gran_Premio_de_Portugal_de_Motociclismo_de_2026)
- Resultados lista todas as etapas concluídas da categoria e da temporada escolhidas. O portal indica quando ainda não tem a classificação de uma etapa. A cobertura por corrida é parcial nas temporadas anteriores de motociclismo e em outras séries fora da Fórmula 1.
- O arquivo associa números às temporadas a partir dos resultados da F1 e das listas de inscritos das demais categorias. Quando uma pessoa correu com mais de um número, o portal exibe os registros confirmados para aquele ano. Os números dos carros compartilhados também aparecem nos perfis de seus pilotos.
- O complemento de resultados inclui Monza por classe do WEC, Cascavel na Stock Car e Homestead na NASCAR. As classificações de Monza e Cascavel apresentam as posições da fonte consultada. [FIA WEC](https://api.fia.com/events/world-endurance-championship/season-2026/6-hours-monza/race-classification) · [Cascavel](https://www.band.com.br/esportes/velocidade/stock-car/casagrande-resiste-a-camilo-e-vence-etapa-de-cascavel-na-stock-car) · [NASCAR Homestead](https://www.nascar.com/live-results/nascar-cup-series/2026-nascar-cup-series-championship-race/)
- As fotos são miniaturas livres consultadas pela API do Wikimedia. Cada perfil com foto exibe o link do arquivo original com créditos e licença. As iniciais ocupam o mesmo espaço quando a imagem está indisponível.

`scripts/build-motorsport-archive.py` processa o ZIP CSV do F1DB e as páginas HTML de temporada salvas localmente. `scripts/build-motorcycle-results.py` lê o HTML de temporada `moto-2026.html` e as páginas de cada GP salvas como `moto-stage-2026-{etapa}.html` e `moto-stage-es-2026-{etapa}.html`, conforme a lista do importador. Os importadores usam Beautiful Soup. `scripts/build-pilot-portraits.py` consulta as páginas de pilotos e atualiza o catálogo de retratos. Os JSON gerados ficam em `src/lib`.
