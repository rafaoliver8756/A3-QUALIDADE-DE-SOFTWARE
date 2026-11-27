USE equipcheck;

-- RF01: cadastro de equipamentos (todos nascem Bloqueados)
INSERT INTO equipamento (id_equipamento, versao_firmware, versao_software, cadastrado_por) VALUES
  ('EQP-001', 'FW 2.1.0', 'SW 5.3.2', 'Maria Silva'),
  ('EQP-002', 'FW 2.1.0', 'SW 5.3.2', 'Maria Silva'),
  ('EQP-003', 'FW 1.9.4', 'SW 5.2.0', 'João Souza'),
  ('EQP-004', 'FW 3.0.1', 'SW 6.0.0', 'João Souza'),
  ('EQP-005', 'FW 3.0.1', 'SW 6.0.0', 'Ana Lima');

INSERT INTO inspecao (id_equipamento, medicao, responsavel, observacao) VALUES
  ('EQP-001', 15.50, 'Carlos Mendes',  'Inspeção inicial dentro da faixa'),
  ('EQP-002', 22.30, 'Carlos Mendes',  'Medição acima da tolerância'),
  ('EQP-003',  9.99, 'Fernanda Rocha', 'Medição logo abaixo do limite inferior'),
  ('EQP-004', 10.00, 'Fernanda Rocha', 'Limite inferior da faixa (borda)');

-- RF04 + RF05 (UC05): aprovações feitas pelo responsável técnico, com justificativa
SET @id_insp = (SELECT MAX(id_inspecao) FROM inspecao WHERE id_equipamento = 'EQP-001');
UPDATE inspecao
    SET aprovada = 1,
        responsavel_alteracao   = 'Rita Costa',
        justificativa_alteracao = 'Medição conferida e aprovada pela qualidade'
  WHERE id_inspecao = @id_insp;

SET @id_insp = (SELECT MAX(id_inspecao) FROM inspecao WHERE id_equipamento = 'EQP-004');
UPDATE inspecao
    SET aprovada = 1,
        responsavel_alteracao   = 'Rita Costa',
        justificativa_alteracao = 'Borda inferior da faixa validada pela qualidade'
  WHERE id_inspecao = @id_insp;

-- EQP-004: segunda inspeção na borda superior, também aprovada -> continua Apto
INSERT INTO inspecao (id_equipamento, medicao, responsavel, observacao) VALUES
  ('EQP-004', 20.00, 'Fernanda Rocha', 'Limite superior da faixa (borda)');

SET @id_insp = (SELECT MAX(id_inspecao) FROM inspecao WHERE id_equipamento = 'EQP-004');
UPDATE inspecao
    SET aprovada = 1,
        responsavel_alteracao   = 'Rita Costa',
        justificativa_alteracao = 'Borda superior da faixa validada pela qualidade'
  WHERE id_inspecao = @id_insp;

-- RF04: reinspeções dentro da faixa, mas ainda sem aprovação
INSERT INTO inspecao (id_equipamento, medicao, responsavel, observacao) VALUES
  ('EQP-002', 18.00, 'Carlos Mendes',  'Reinspeção aguardando aprovação'),
  ('EQP-003', 14.00, 'Fernanda Rocha', 'Reinspeção aguardando aprovação');

-- RF04 + RF05: aprovação da reinspeção do EQP-002 (volta a Apto)
SET @id_insp = (SELECT MAX(id_inspecao) FROM inspecao WHERE id_equipamento = 'EQP-002');
UPDATE inspecao
    SET aprovada = 1,
        responsavel_alteracao   = 'Rita Costa',
        justificativa_alteracao = 'Aprovação após revisão da evidência de calibração'
  WHERE id_inspecao = @id_insp;

-- RF05 + RF06: correção de dado de inspeção (EQP-001, primeira inspeção)
SET @id_insp = (SELECT MIN(id_inspecao) FROM inspecao WHERE id_equipamento = 'EQP-001');
UPDATE inspecao
    SET medicao = 15.05,
        responsavel_alteracao   = 'Rita Costa',
        justificativa_alteracao = 'Correção de digitação da medição conforme planilha de bancada'
  WHERE id_inspecao = @id_insp;

-- RF05 + RF06: mudanças de versão (geram historico_equipamento)
UPDATE equipamento
    SET versao_firmware = 'FW 2.2.0',
        responsavel_alteracao   = 'Ana Lima',
        justificativa_alteracao = 'Atualização para corrigir falha de comunicação com o aplicativo'
  WHERE id_equipamento = 'EQP-001';

UPDATE equipamento
    SET versao_firmware = 'FW 1.9.5',
        versao_software = 'SW 5.4.0',
        responsavel_alteracao   = 'Ana Lima',
        justificativa_alteracao = 'Atualização conjunta para compatibilizar firmware e aplicativo'
  WHERE id_equipamento = 'EQP-003';

UPDATE equipamento
    SET versao_software = 'SW 6.1.0',
        responsavel_alteracao   = 'João Souza',
        justificativa_alteracao = 'Nova versão do aplicativo de configuração liberada pela engenharia'
  WHERE id_equipamento = 'EQP-004';

-- Inspeções após as mudanças de versão: cada registro guarda as versões vigentes
INSERT INTO inspecao (id_equipamento, medicao, responsavel, observacao) VALUES
  ('EQP-001', 17.20, 'Carlos Mendes',  'Reinspeção após atualização de firmware'),
  ('EQP-004', 25.00, 'Fernanda Rocha', 'Falha após atualização do aplicativo para SW 6.1.0');

SET @id_insp = (SELECT MAX(id_inspecao) FROM inspecao WHERE id_equipamento = 'EQP-001');
UPDATE inspecao
    SET aprovada = 1,
        responsavel_alteracao   = 'Rita Costa',
        justificativa_alteracao = 'Reinspeção aprovada com o novo firmware FW 2.2.0'
  WHERE id_inspecao = @id_insp;