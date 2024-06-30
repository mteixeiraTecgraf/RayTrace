# RayTrace

## Breve Descrição

Este software é uma implementação de um algoritmo de traçado de raios em um framework web, com modelagem de cena e configuração de parâmetros. O programa se enquadra na área de computação gráfica e destina-se a pessoas interessadas em entender a modelagem de um simulador físico de cenas gráficas utilizando algoritmos de traçado de raios com iluminação global e técnicas de aceleração do processo. Embora utilize uma tecnologia que pode se tornar obsoleta rapidamente, espera-se que seja uma ferramenta valiosa para a experimentação de algoritmos e aprendizado de técnicas.

### Funções Específicas
- Exibição de um modelo de renderizador.
- Framework para modelagem de cenas.
- Visualização de cenas modeladas para renderização com RayTrace.
- Monitoramento de parâmetros de performance da renderização.
- Visualização de profundidades de raios para compreensão dos algoritmos.
- Customização de configurações, incluindo:
  - Teste de colisão (Hit Test)
  - Renderização de normais no ponto de colisão (Hit point Normal Render)
  - Ângulo de incidência do raio (Hit Incidence Angle)
  - Decaimento beta (Beta decay)
- Implementação utilizando técnicas de estimação de integrais de Monte Carlo.
- Utilização da técnica da roleta russa.

### Público-alvo
O programa foi concebido para atender alunos de computação gráfica, algoritmos de traçado de raios, técnicas de simulação física e técnicas de otimização.

### Natureza do Programa
Este é um experimento web de modelagem e aplicação de algoritmos de traçado de raios com diversas configurações e cenários.

### Ressalvas
O software utiliza processamento em CPU, podendo ser mais lento que aplicações convencionais que utilizam GPU e/ou aceleradores gráficos.


## Visão de Projeto

Esta seção deve conter **no mínimo 4 cenários** (**2 de cada tipo indicado**), cuja função é orientar não apenas o projeto do software, mas também o seu uso e eventual evolução. No caso de **projeto**, os cenários expressam a INTENÇÃO DO CRIADOR, funcionando como uma bússola para manter ou corrigir rumos. Os cenários podem ser continuamente revisados, a fim de que ao final do projeto estejam em plena sintonia com o que o programa é, faz e não faz. No caso de **uso**, os cenários orientam a INTERPRETAÇÃO DO USUÁRIO ao interagir com o programa, permitindo que possa julgar se está fazendo um uso esperado ou inesperado do programa, o que ajuda muito a decidir o que fazer em casos de eventuais erros de interação ou execução. Finalmente, no caso de **evolução** do programa, os cenários ORIENTAM PROGRAMADORES COLABORADORES a como, quando e se reutilizar e modificar o programa para novas finalidades ou condições.

<div style="margin-left:10px; background:#D3E6F6; padding:3px;">
<p>Onde aprender sobre o que são cenários, para que servem, com que se parecem, e mais:<br />
<a href="https://www.sciencedirect.com/science/article/pii/S0953543800000230#FIG2" target="_New"><b>Artigo de John Carroll (1999)</b></a>.</p>

<p>O objetivo desta parte do relatório é levar vocês a pensarem sobre a experiência **do outro** com o programa de vocês. Este exercício é muito simples e extremamente benéfico para o resultado final do programa. Aproveitem a oportunidade.<p>
</div> 

***

### Cenário Positivo 1 (i.e. cenário que dá certo)

[Esta é uma tradução do Cenário do Artigo de John Carroll:] 
Harry está interessado em problemas com pontes; quando criança, ele viu uma pequena ponte desabar quando seus apoios foram minados após uma forte chuva. Ele abre o estudo de caso da Ponte Tacoma Narrows e pede para ver o filme de quando ela desmoronou. Ele fica chocado ao ver a ponte primeiro balançar, depois ondular e, por fim, se desprender. Ele rapidamente reproduz o filme e, em seguida, abre o módulo do curso associado a movimento harmônico. Ele navega pelo material do curso (sem fazer os exercícios), salva o trecho do filme em seu caderno com uma anotação em áudio e, em seguida, faz uma consulta em linguagem natural para encontrar referências a outras manifestações físicas do movimento harmônico. Aí, ele passa para um estudo de caso envolvendo flautas e pícolos

> Como é explicado no artigo, este cenário "evoca" várias propriedades de uma tecnologia que Harry está usando como auxílio para seus estudos escolares. Reparem que não há nenhum detalhamento de "como" Harry abre o estudo de caso, como reproduz o filme, como salva o vídeo em seu caderno, como faz a anotação em áudio, como faz outra busca. Porém, neste curto parágrafo já está muito claro o que a tecnologia se propõe a fazer e quais as suas principais funções. Também está claro o perfil de pelo menos 1 dos tipos de usuários visados. Quando um programa tem vários usos e usuários visados, os cenários ajudam a balizar o que podemos esperar em cada caso.

### Cenário Positivo 2

[Coloque aqui o seu segundo cenário que dá certo]

### Cenário Negativo 1 (i.e. cenário que expõe uma limitação conhecida e esperada do programa)

[Vou usar aqui uma variante do cenário de Carroll para ilustrar o que é um cenário negativo:]
Harry está interessado em problemas com pontes; quando criança, ele viu uma pequena ponte desabar quando seus apoios foram minados após uma forte chuva. Ele abre o estudo de caso da Ponte Tacoma Narrows e pede para ver o filme de quando ela desmoronou. Porém, ao invés de aparecer um vídeo do acidente com aquela ponte, aparece uma tela com uma mensagem do reprodutor. Ele não entende muito bem a mensagem, mas parece que há uma configuração especial que ele tem que fazer no browser dele para que o vídeo seja reproduzido. Ele tenta fazer o que é indicado, mas não tem resultado positivo. Desanimado, ele desiste de ver aquele vídeo e procura outro exemplo para seu estudo sobre movimento harmônico.

> Este cenário ilustra o que pode acontecer por causa de uma limitação do programa. Não foram feitos testes exaustivos com todos os tipos de vídeo, em todos os browsers. Apenas os tipos atuais mais utilizados foram testados. Assim, pode ser que um vídeo em formato mais antigo ou com um reprodutor menos utilizado hoje não funcione corretamente. Na maioria destes casos, uma mudança de configuração no navegador (instruída pela própria interface do navegador) resolve o problema. 

### Cenário Negativo 2

[Coloque aqui o seu segundo cenário que expõe uma outra limitação do seu programa, ou um aspecto diferente da anterior, que não aparece no cenário negativo 1]

## Documentação Técnica do Projeto

Esta seção da Wiki se destina a pessoas que queiram reutilizar, total ou parcialmente, o seu programa. Portanto, ofereça todas as informações necessárias. Os três itens a seguir são os mais utilizados. Escolha com o(a) orientador(a) do projeto quais destes itens devem ser incluídos. Para cada item incluído, crie uma seção específica.
- Especificação de requisitos funcionais e não-funcionais do sotware
- Descrição ou modelo de arquitetura, dados, semântica ou outra dimensão relevante do software
- Descrição ou modelo funcional do software
- Sobre o código (detalhes da linguagem ou da técnica de programação utilizada, da estratégia de comentários em linha, das diretivas de compilação, se houver, etc.)

![alt text](docs/diagrams/classDiagram.png)


## Requisitos Funcionais

### 1. Exibição do Modelo de Renderizador
- **ID:** RF-01
- **Descrição:** O sistema deve ser capaz de renderizar cenas gráficas configuradas pelo usuário.
- **Entrada:** Arquivo de configuração YAML contendo a definição da cena.
- **Saída:** Renderização visual da cena definida.

### 2. Modelagem de Cenas
- **ID:** RF-02
- **Descrição:** O sistema deve fornecer modelos que permitam aos usuários modelar cenas gráficas.
- **Entrada:** Interface de usuário para definição de entidades, materiais, formas e transformações.
- **Saída:** Cena modelada pronta para renderização.

### 3. Visualização de Cenas Modeladas para Renderização com RayTrace
- **ID:** RF-03
- **Descrição:** O sistema deve permitir a visualização de cenas modeladas utilizando o algoritmo de traçado de raios.
- **Entrada:** Cena modelada.
- **Saída:** Visualização da cena renderizada.

### 4. Monitoramento de Parâmetros de Performance da Renderização
- **ID:** RF-04
- **Descrição:** O sistema deve monitorar e exibir parâmetros de performance durante a renderização.
- **Entrada:** Processos de renderização.
- **Saída:** Métricas de performance (tempo de renderização, uso de CPU, etc.).

### 5. Visualização de Profundidades de Raios para Compreensão dos Algoritmos
- **ID:** RF-05
- **Descrição:** O sistema deve permitir a visualização das profundidades dos raios para ajudar na compreensão dos algoritmos de traçado de raios.
- **Entrada:** Processos de renderização com traçado de raios.
- **Saída:** Visualização das profundidades dos raios.

### 6. Customização e Técnicas de Renderização
- **ID:** RF-06
- **Descrição:** O sistema deve permitir a customização de várias configurações e ativação do uso de técnicas avançadas de renderização para experimentação de algoritmos.
- **Sub-requisitos:**
  - **Configurações de Renderização:**
    - **Teste de Colisão (Hit Test):** Verificação dos pontos de colisão dos raios.
    - **Renderização de Normais no Ponto de Colisão (Hit Point Normal Render):** Visualização das normais no ponto de colisão.
    - **Ângulo de Incidência do Raio (Hit Incidence Angle):** Cálculo do ângulo de incidência dos raios.
    - **Decaimento Beta (Beta Decay):** Aplicação da técnica de decaimento beta.
  - **Técnicas:**
    - **Estimação de Integrais de Monte Carlo:** Implementação para a renderização utilizando estimação de Monte Carlo.
    - **Roleta Russa:** Implementação para otimização do traçado de raios.

## Requisitos Não Funcionais

### 1. Desempenho
#### 1.1. Monitoramento do Tempo de Renderização
- **ID:** RNF-01
- **Descrição:** O sistema deve permitir que os usuários acompanhem e estimem a duração da renderização de cenas.
- **Prioridade:** Alta

#### 1.2. Especificações de Hardware
- **ID:** RNF-02
- **Descrição:** O sistema deve utilizar CPU e consumir até 4GB de RAM, sendo projetado para configurações de hardware modernas.
- **Prioridade:** Alta

### 2. Usabilidade
#### 2.1. Interface do Usuário
- **ID:** RNF-03
- **Descrição:** A interface do sistema deve ser uma aplicação web desenvolvida com o framework Angular.
- **Prioridade:** Alta

#### 2.2. Suporte a Múltiplos Idiomas
- **ID:** RNF-04
- **Descrição:** A interface do sistema deve oferecer suporte para termos em inglês e português.
- **Prioridade:** Média

### 3. Confiabilidade
#### 3.1. Tratamento de Falhas de Hardware
- **ID:** RNF-05
- **Descrição:** O sistema não deve tratar falhas de hardware durante a renderização, mas deve ser robusto para falhas comuns.
- **Prioridade:** Média

### 4. Manutenibilidade
#### 4.1. Convenções de Codificação
- **ID:** RNF-06
- **Descrição:** O sistema deve ser desenvolvido utilizando orientação a objetos e TypeScript, seguindo boas práticas de codificação.
- **Prioridade:** Alta

### 5. Portabilidade
#### 5.1. Sistemas Operacionais Suportados
- **ID:** RNF-07
- **Descrição:** O sistema deve ser compatível com qualquer sistema operacional capaz de executar um servidor web e cliente HTML5.
- **Prioridade:** Alta

#### 5.2. Navegadores Suportados
- **ID:** RNF-08
- **Descrição:** O sistema deve ser compatível com qualquer navegador moderno que suporte aplicações web desenvolvidas em Angular.
- **Prioridade:** Alta

### 6. Tecnologia e Implementação
#### 6.1. Uso de Modelos e Classes Próprias
- **ID:** RNF-09
- **Descrição:** O sistema deve utilizar modelos e classes próprias para a modelagem e renderização de cenas, sem recorrer a ferramentas prontas ou bibliotecas externas específicas para essa tarefa.
- **Prioridade:** Alta

#### 6.2. Exclusão de Aceleradores Gráficos
- **ID:** RNF-10
- **Descrição:** O sistema não deve utilizar aceleradores gráficos como GPUs para o processamento de renderização.
- **Prioridade:** Alta

#### 6.3. Implementação de Algoritmos Internamente
- **ID:** RNF-11
- **Descrição:** Todos os algoritmos de renderização e traçado de raios devem ser implementados internamente, sem utilizar algoritmos prontos ou bibliotecas externas.
- **Prioridade:** Alta

## Manual de Utilização para Usuários Contemplados

> O manual de utilização deve ser elaborado **para todos os tipos de usuários contemplados**. Deve também ser consistente com todo o restante do conteúdo da Wiki, o que inclui descrição, cenários e documentação técnica.

O formato mais prático para a elaboração de um manual de uso é seguir a estrutura sugerida a seguir, **para cada tarefa que o usuário pode realizar (o que envolve usar várias funções) e para cada função básica que o programa oferece**:

```
{ 
  Guia de Instruções:
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  Para [Tarefa A: por exemplo, no cenário usado, BUSCAR VÍDEO] faça:
  Passo 1: ...
  Passo 2: ...
  ...
  Passo N: ...

  >>> Se houver diferentes maneiras de realizar a Tarefa A, descreva cada uma delas.
  >>> E se em certos contextos, uma alternativa for melhor que outra, informe e explique.

  Exceções ou potenciais problemas:
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  Se [Condição Prevista C1: por exemplo, o vídeo for encontrado mas o link está 'quebrado']
     {
     Então faça: [Passo 1, Passo 2, ..., Passo N] 
     ou
     É porque: [explique o problema, se não há uma sugestão para solucionar] 
     } 
  
  Se [Condição Prevista C2: ... 
  ...
  Se [Condição Prevista CN: ...      
}

>>> Repita a estrutura do Guia acima para cada tarefa e função básica.

```