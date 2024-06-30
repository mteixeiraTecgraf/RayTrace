# Raytrace

Este software é uma implementação de um algoritmo de traçado de raios em um framework web, com modelagem de cena e configuração de parâmetros. O programa se enquadra na área de computação gráfica e destina-se a pessoas interessadas em entender a modelagem de um simulador físico de cenas gráficas utilizando algoritmos de traçado de raios com iluminação global e técnicas de aceleração do processo. Embora utilize uma tecnologia que pode se tornar obsoleta rapidamente, espera-se que seja uma ferramenta valiosa para a experimentação de algoritmos e aprendizado de técnicas.


Os codigos tambem estao disponiveis em 'https://git.tecgraf.puc-rio.br/mteixeira/mestrado-raytrace.git'


## Desenvolvimento
Este projeto é desenvolvido em [Angular CLI](https://github.com/angular/angular-cli) versao 15.2.4.

### Angular

Execute `ng serve` para executar o servidor de desenvolvimento. Navegue até `http://localhost:4200/`. 

## Executando

- Abra o Navegador em `http://localhost:4200/`.
- Copie o cenario [neste Link](src/assets/Scene1.yaml)
- Clique em Cena 1 para carregar a Cena na area Render
- Quando Aparecer o Texto `Renderizacao Concluida`, podera ver que a renderização foi feita considerando a quantidade de samples especificadas
- Veja em stats algumas informações acerca do tempo da renderização

## Compilação Final

Execute `ng build` pra compilar o projeto para uma versão final de distribuição. Os artefatos serão encontrados na pasta `dist/`.
