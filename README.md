
# Chronos – Sistema de Controle de Ponto

Um sistema backend para gerenciamento de ponto, escala, tarefas e holerites de funcionários, com autenticação, permissões por papel (admin, chefia, funcionário) e cálculos automáticos de horas trabalhadas.


## Tecnologias Utilizadas

- Node.js + Express.js: Backend RESTful
- MongoDB: Banco de dados NoSQL
- JWT 
- Swagger (Documentação das rotas)
- bcryptjs 
- Controle de papéis (admin, chefia, funcionário)

## Funcionalidades Implementadas
### Usuários
- Cadastro de usuários (admin cria chefias e funcionários)
- Listar funcionários e chefias
- CRUD simples de usuários (editar/excluir)

### Ponto

- Registrar entrada, saída, início de almoço e retorno
- Armazenamento com timestamp e localização
- Consulta de pontos do usuário logado

### Holerite

- Criação e edição de holerite automático baseado nos pontos
- Cálculo de horas trabalhadas por dia (subtraindo almoço, máximo 1h)
- Cálculo do salário líquido (valor por hora * horas trabalhadas – descontos)
- Detalhamento diário das horas trabalhadas
- Holerite do usuário logado e lista completa (admin)

### Escala

- Criação e edição de escalas para funcionários 
- Consulta de escalas próprias ou de todos (admin)

### Tarefas  

- Criação, atualização e exclusão de tarefas (chefia/admin)
- Consulta de tarefas por funcionário
## Configuração

1. Clonar o repositório:

```bash
git clone <REPO_URL>
cd chronos
```
3. Criar arquivo .env com as variáveis:

```bash
PORT=5000
MONGO_URI=<SUA PORTA MONGODB>
JWT_SECRET=supersecreta123

CORS_ORIGIN=*
CREATE_SECRET=123456
ADMIN_EMAIL=admin@email.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin

```
4. Rodar o servidor:

```bash
npm run dev

```
