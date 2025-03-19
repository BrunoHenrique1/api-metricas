require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Rota de teste
app.get("/", (req, res) => {
  res.send("API de Métricas para R está rodando!");
});

// 📊 1️⃣ Média das notas por matéria
app.get("/media-notas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.nome AS materia, ROUND(AVG(r.nota), 2) AS media
      FROM resultado_avaliacao r
      JOIN avaliacao a ON r.fk_avaliacao = a.id
      JOIN materia m ON a.fk_materia = m.id
      GROUP BY m.nome
      ORDER BY media DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao calcular média de notas:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 2️⃣ Taxa de aprovação por matéria
app.get("/taxa-aprovacao", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.nome AS materia,
        ROUND(100 * SUM(CASE WHEN r.aprovacao THEN 1 ELSE 0 END) / COUNT(*), 2) AS taxa_aprovacao
      FROM resultado_avaliacao r
      JOIN avaliacao a ON r.fk_avaliacao = a.id
      JOIN materia m ON a.fk_materia = m.id
      GROUP BY m.nome
      ORDER BY taxa_aprovacao DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao calcular taxa de aprovação:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 3️⃣ Média de notas por professor
app.get("/desempenho-professor", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.nome AS professor, ROUND(AVG(r.nota), 2) AS media_notas
      FROM resultado_avaliacao r
      JOIN avaliacao a ON r.fk_avaliacao = a.id
      JOIN professor p ON a.fk_professor = p.id
      GROUP BY p.nome
      ORDER BY media_notas DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao calcular desempenho dos professores:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 4️⃣ Histórico de notas por aluno
app.get("/desempenho-aluno/:id", async (req, res) => {
  const alunoId = req.params.id;
  try {
    const result = await pool.query(`
      SELECT a.nome AS aluno, m.nome AS materia, r.nota, r.data
      FROM resultado_avaliacao r
      JOIN aluno a ON r.fk_aluno = a.id
      JOIN avaliacao av ON r.fk_avaliacao = av.id
      JOIN materia m ON av.fk_materia = m.id
      WHERE a.id = $1
      ORDER BY r.data DESC
    `, [alunoId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar histórico de notas:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
