import fs from "fs"
import readline from "readline"
import express from "express"
import dotenv from "dotenv"

dotenv.config()

const modo = process.argv[2]

const server = express()
server.use(express.json())

const PORT = Number(process.env.PORT) || 3000

const ARQUIVO = "assinaturas.txt"

function ler() {
  if (!fs.existsSync(ARQUIVO)) fs.writeFileSync(ARQUIVO, "")
  const dados = fs.readFileSync(ARQUIVO, "utf-8")
  if (dados.trim() === "") return []
  return dados.split("\n").map(l => JSON.parse(l))
}

function salvar(lista: any[]) {
  const texto = lista.map(i => JSON.stringify(i)).join("\n")
  fs.writeFileSync(ARQUIVO, texto)
}

if (modo === "terminal") {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  function cadastrar() {
    rl.question("Serviço: ", servico => {
      rl.question("Valor: ", valor => {
        rl.question("Vencimento: ", vencimento => {
          const lista = ler()
          lista.push({ id: Date.now(), servico, valor, vencimento })
          salvar(lista)
          console.log("Cadastrado")
          menu()
        })
      })
    })
  }

  function listar() {
    console.log(ler())
    menu()
  }

  function atualizar() {
    const lista = ler()
    rl.question("ID: ", idTxt => {
      const id = Number(idTxt)
      const i = lista.findIndex(a => a.id === id)
      if (i === -1) {
        console.log("Não encontrado")
        return menu()
      }

      rl.question("Novo serviço: ", servico => {
        rl.question("Novo valor: ", valor => {
          rl.question("Novo vencimento: ", vencimento => {
            lista[i] = { ...lista[i], servico, valor, vencimento }
            salvar(lista)
            console.log("Atualizado")
            menu()
          })
        })
      })
    })
  }

  function excluir() {
    const lista = ler()
    rl.question("ID: ", idTxt => {
      const id = Number(idTxt)
      salvar(lista.filter(a => a.id !== id))
      console.log("Excluído")
      menu()
    })
  }

  function menu() {
    console.log("\n1 Cadastrar\n2 Listar\n3 Atualizar\n4 Excluir\n5 Sair")
    rl.question("Opção: ", op => {
      if (op === "1") cadastrar()
      else if (op === "2") listar()
      else if (op === "3") atualizar()
      else if (op === "4") excluir()
      else if (op === "5") process.exit()
      else menu()
    })
  }

  menu()
}

if (modo === "web") {
  server.get("/", (req, res) => {
    res.send("Gerenciador de Assinaturas Online")
  })

  server.get("/assinaturas", (req, res) => {
    res.json(ler())
  })

  server.post("/assinaturas", (req, res) => {
    const lista = ler()
    const { servico, valor, vencimento } = req.body
    const nova = { id: Date.now(), servico, valor, vencimento }
    lista.push(nova)
    salvar(lista)
    res.json(nova)
  })

  server.put("/assinaturas/:id", (req, res) => {
    const lista = ler()
    const id = Number(req.params.id)
    const i = lista.findIndex(a => a.id === id)
    if (i === -1) return res.status(404).json({ erro: "Não encontrado" })
    lista[i] = { ...lista[i], ...req.body }
    salvar(lista)
    res.json(lista[i])
  })

  server.delete("/assinaturas/:id", (req, res) => {
    const id = Number(req.params.id)
    salvar(ler().filter(a => a.id !== id))
    res.json({ status: "Excluído" })
  })

  server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
  })
}
