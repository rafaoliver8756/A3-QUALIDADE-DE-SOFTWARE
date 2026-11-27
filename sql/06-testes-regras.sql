USE equipcheck;

DROP PROCEDURE IF EXISTS sp_espera_erro;

DELIMITER $$

CREATE PROCEDURE sp_espera_erro(IN p_requisito VARCHAR(10),
                                IN p_caso      VARCHAR(150),
                                IN p_sql       TEXT)
BEGIN
  DECLARE v_msg TEXT DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    GET DIAGNOSTICS CONDITION 1 v_msg = MESSAGE_TEXT;

  SET @sql_teste = p_sql;
  PREPARE st FROM @sql_teste;
  EXECUTE st;
  DEALLOCATE PREPARE st;

  INSERT INTO tmp_resultado (requisito, caso, resultado, detalhe)
  VALUES (p_requisito, p_caso,
          IF(v_msg IS NULL, 'FALHOU', 'OK'),
          COALESCE(v_msg, 'O comando foi aceito, mas deveria ser rejeitado'));
END$$
DELIMITER ;

DROP TEMPORARY TABLE IF EXISTS tmp_resultado;
CREATE TEMPORARY TABLE tmp_resultado (
  ordem     INT AUTO_INCREMENT PRIMARY KEY,
  requisito VARCHAR(10),
  caso      VARCHAR(150),
  resultado VARCHAR(10),
  detalhe   VARCHAR(500)
) ENGINE=MEMORY;

START TRANSACTION;

-- RF01: cadastro de equipamento

CALL sp_espera_erro('RF01', 'ID repetido é rejeitado',
  "INSERT INTO equipamento (id_equipamento, versao_firmware, versao_software, cadastrado_por) VALUES ('EQP-001', 'FW 1', 'SW 1', 'Teste')");
CALL sp_espera_erro('RF01', 'ID fora do formato EQP-NNN é rejeitado',
  "INSERT INTO equipamento (id_equipamento, versao_firmware, versao_software, cadastrado_por) VALUES ('EQ-1042', 'FW 1', 'SW 1', 'Teste')");
CALL sp_espera_erro('RF01', 'Firmware vazio é rejeitado',
  "INSERT INTO equipamento (id_equipamento, versao_firmware, versao_software, cadastrado_por) VALUES ('EQP-900', '  ', 'SW 1', 'Teste')");
CALL sp_espera_erro('RF01', 'Software ausente (NULL) é rejeitado',
  "INSERT INTO equipamento (id_equipamento, versao_firmware, versao_software, cadastrado_por) VALUES ('EQP-901', 'FW 1', NULL, 'Teste')");

-- RF02: medição numérica

CALL sp_espera_erro('RF02', 'Medição não numérica é rejeitada',
  "INSERT INTO inspecao (id_equipamento, medicao, responsavel) VALUES ('EQP-005', 'abc', 'Teste')");
CALL sp_espera_erro('RF02', 'Inspeção de equipamento inexistente é rejeitada',
  "INSERT INTO inspecao (id_equipamento, medicao, responsavel) VALUES ('EQP-999', 15.00, 'Teste')");
CALL sp_espera_erro('RF02', 'Inspeção sem responsável é rejeitada',
  "INSERT INTO inspecao (id_equipamento, medicao, responsavel) VALUES ('EQP-005', 15.00, '   ')");

-- RF03: classificação pelas bordas 9.99 / 10.00 / 20.00 / 20.01

INSERT INTO inspecao (id_equipamento, medicao, responsavel, observacao) VALUES
  ('EQP-005',  9.99, 'Teste', 'borda'),
  ('EQP-005', 10.00, 'Teste', 'borda'),
  ('EQP-005', 20.00, 'Teste', 'borda'),
  ('EQP-005', 20.01, 'Teste', 'borda');

INSERT INTO tmp_resultado (requisito, caso, resultado, detalhe)
SELECT 'RF03', CONCAT('Medição ', medicao, ' classificada como ', esperado),
      IF(classificacao = esperado, 'OK', 'FALHOU'),
      CONCAT('Obtido: ', classificacao)
FROM (SELECT medicao, classificacao,
            CASE WHEN medicao IN (10.00, 20.00) THEN 'Apto' ELSE 'Bloqueado' END AS esperado
        FROM inspecao
      WHERE id_equipamento = 'EQP-005' AND observacao = 'borda') t;

CALL sp_espera_erro('RF03', 'Classificação não pode ser informada pelo usuário',
  "INSERT INTO inspecao (id_equipamento, medicao, classificacao, responsavel) VALUES ('EQP-005', 25.00, 'Apto', 'Teste')");


-- RF04: desbloqueio somente após nova inspeção aprovada

CALL sp_espera_erro('RF04', 'Inspeção não pode nascer aprovada (aprovação é etapa separada)',
  "INSERT INTO inspecao (id_equipamento, medicao, aprovada, responsavel) VALUES ('EQP-005', 15.00, 1, 'Teste')");

INSERT INTO inspecao (id_equipamento, medicao, responsavel) VALUES ('EQP-005', 15.00, 'Teste');
SET @id_t = LAST_INSERT_ID();

INSERT INTO tmp_resultado (requisito, caso, resultado, detalhe)
SELECT 'RF04', 'Inspeção dentro da faixa sem aprovação não libera',
        IF(status = 'Bloqueado', 'OK', 'FALHOU'), CONCAT('Status: ', status)
  FROM equipamento WHERE id_equipamento = 'EQP-005';

UPDATE inspecao SET aprovada = 1,
        responsavel_alteracao = 'Teste', justificativa_alteracao = 'Aprovação no teste automatizado'
  WHERE id_inspecao = @id_t;

INSERT INTO tmp_resultado (requisito, caso, resultado, detalhe)
SELECT 'RF04', 'Inspeção dentro da faixa e aprovada libera (Apto)',
        IF(status = 'Apto', 'OK', 'FALHOU'), CONCAT('Status: ', status)
  FROM equipamento WHERE id_equipamento = 'EQP-005';

UPDATE inspecao SET aprovada = 0,
        responsavel_alteracao = 'Teste', justificativa_alteracao = 'Revogação da aprovação no teste'
  WHERE id_inspecao = @id_t;

INSERT INTO tmp_resultado (requisito, caso, resultado, detalhe)
SELECT 'RF04', 'Revogar a aprovação volta a Bloqueado',
        IF(status = 'Bloqueado', 'OK', 'FALHOU'), CONCAT('Status: ', status)
  FROM equipamento WHERE id_equipamento = 'EQP-005';

INSERT INTO inspecao (id_equipamento, medicao, responsavel) VALUES ('EQP-005', 30.00, 'Teste');

INSERT INTO tmp_resultado (requisito, caso, resultado, detalhe)
SELECT 'RF04', 'Inspeção fora da faixa bloqueia',
        IF(status = 'Bloqueado', 'OK', 'FALHOU'), CONCAT('Status: ', status)
  FROM equipamento WHERE id_equipamento = 'EQP-005';


-- RF05: responsável e justificativa obrigatórios nas alterações

CALL sp_espera_erro('RF05', 'Alterar versão sem responsável é rejeitado',
  "UPDATE equipamento SET versao_firmware = 'FW 9.9.9', responsavel_alteracao = NULL, justificativa_alteracao = 'Justificativa válida de teste' WHERE id_equipamento = 'EQP-005'");
CALL sp_espera_erro('RF05', 'Alterar versão com justificativa curta é rejeitado',
  "UPDATE equipamento SET versao_firmware = 'FW 9.9.9', responsavel_alteracao = 'Teste', justificativa_alteracao = 'curta' WHERE id_equipamento = 'EQP-005'");
CALL sp_espera_erro('RF05', 'Repetir a justificativa anterior é rejeitado',
  "UPDATE equipamento SET versao_software = 'SW 9.9.9', responsavel_alteracao = 'Teste', justificativa_alteracao = justificativa_alteracao WHERE id_equipamento = 'EQP-001'");
CALL sp_espera_erro('RF05', 'Corrigir medição sem justificativa é rejeitado',
  "UPDATE inspecao SET medicao = 12.00, responsavel_alteracao = 'Teste', justificativa_alteracao = NULL WHERE id_equipamento = 'EQP-001' ORDER BY id_inspecao LIMIT 1");
CALL sp_espera_erro('RF05', 'Alterar o responsável original da inspeção é rejeitado',
  "UPDATE inspecao SET responsavel = 'Outro', responsavel_alteracao = 'Teste', justificativa_alteracao = 'Tentativa de troca de responsável' WHERE id_equipamento = 'EQP-001' ORDER BY id_inspecao LIMIT 1");


-- RF06: histórico preservado e imutável

CALL sp_espera_erro('RF06', 'Alterar versões gravadas na inspeção é rejeitado',
  "UPDATE inspecao SET versao_firmware = 'FW X', responsavel_alteracao = 'Teste', justificativa_alteracao = 'Tentativa de reescrever o passado' WHERE id_equipamento = 'EQP-001' ORDER BY id_inspecao LIMIT 1");
CALL sp_espera_erro('RF06', 'Excluir equipamento é rejeitado',
  "DELETE FROM equipamento WHERE id_equipamento = 'EQP-005'");
CALL sp_espera_erro('RF06', 'Excluir inspeção é rejeitado',
  "DELETE FROM inspecao WHERE id_equipamento = 'EQP-001'");
CALL sp_espera_erro('RF06', 'Alterar historico_equipamento é rejeitado',
  "UPDATE historico_equipamento SET justificativa = 'adulterado'");
CALL sp_espera_erro('RF06', 'Excluir historico_equipamento é rejeitado',
  "DELETE FROM historico_equipamento");
CALL sp_espera_erro('RF06', 'Alterar historico_inspecao é rejeitado',
  "UPDATE historico_inspecao SET justificativa = 'adulterado'");
CALL sp_espera_erro('RF06', 'Excluir historico_inspecao é rejeitado',
  "DELETE FROM historico_inspecao");

-- Uma correção válida deve gerar um registro em historico_inspecao
SET @antes = (SELECT COUNT(*) FROM historico_inspecao);
UPDATE inspecao SET observacao = 'Observação corrigida no teste',
      responsavel_alteracao = 'Teste', justificativa_alteracao = 'Correção de observação no teste'
  WHERE id_inspecao = @id_t;

INSERT INTO tmp_resultado (requisito, caso, resultado, detalhe)
SELECT 'RF06', 'Correção válida gera registro no histórico',
        IF(COUNT(*) = @antes + 1, 'OK', 'FALHOU'), CONCAT('Registros: ', @antes, ' -> ', COUNT(*))
  FROM historico_inspecao;


ROLLBACK;  -- desfaz todas as alterações feitas pelos testes

SELECT requisito, caso, resultado, detalhe FROM tmp_resultado ORDER BY ordem;
SELECT CONCAT(SUM(resultado = 'OK'), ' de ', COUNT(*), ' testes OK') AS resumo FROM tmp_resultado;

DROP TEMPORARY TABLE tmp_resultado;
DROP PROCEDURE sp_espera_erro;
