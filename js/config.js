/**
 * js/config.js
 * Arquivo de configuração e variáveis globais do sistema.
 * Deve ser o primeiro script a ser carregado.
 */

// ============================================================================
// 1. CONFIGURAÇÃO DA API (BACKEND)
// ============================================================================

// URL do Web App do Google Apps Script
// Se você atualizar o deploy do Apps Script, lembre-se de atualizar esta URL.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNtohug1LnuzYn56ySQ97SvcmNbpxLeZgYYAeKwy_9tyWrH_l3SZKdcJElYQ2eVbEn3w/exec";


// ============================================================================
// 2. CONFIGURAÇÃO DOS SELECTS DINÂMICOS
// ============================================================================

// Define quais campos do formulário são selects que carregam opções do Google Sheets
// e permitem a criação de novas opções ("+ Cadastrar Novo").
const CONFIG_SELECTS = [
    { id: 'municipio', label: 'Município', container: 'container_municipio', key: 'MUNICIPIO' },
    { id: 'bairro', label: 'Bairro', container: 'container_bairro', key: 'BAIRRO' },
    { id: 'status_titulo', label: 'Status Título', container: 'container_status_titulo', key: 'STATUS_TITULO' },
    { id: 'indicacao', label: 'Indicação', container: 'container_indicacao', key: 'INDICACAO' },
    { id: 'tipo_servico', label: 'Tipo Serviço', container: 'container_tipo_servico', key: 'TIPO_SERVICO' },
    { id: 'parceiro', label: 'Parceiro', container: 'container_parceiro', key: 'PARCEIRO' },
    { id: 'especialidade', label: 'Especialidade', container: 'container_especialidade', key: 'ESPECIALIDADE' },
    { id: 'procedimento', label: 'Procedimento', container: 'container_procedimento', key: 'PROCEDIMENTO' },
    { id: 'local', label: 'Local', container: 'container_local', key: 'LOCAL' },
    { id: 'tipo', label: 'Sub-Tipo / Detalhe', container: 'container_tipo', key: 'TIPO' },
    // O 'status_atendimento' tem um nameOverride porque no banco de dados a coluna se chama 'status', não 'status_atendimento'
    { id: 'status_atendimento', label: 'Status', container: 'container_status_atendimento', key: 'STATUS_ATENDIMENTO', nameOverride: 'status' }
];


// ============================================================================
// 3. VARIÁVEIS DE ESTADO GLOBAL (CACHE)
// ============================================================================

// Armazena o paciente que está sendo editado ou visualizado no momento
let pacienteAtual = null;

// Armazena o paciente selecionado na visualização de histórico
let histPacienteAtual = null; 

// Cache das listas completas para evitar requisições repetidas ao filtrar
let todosAtendimentos = [];
let todosPacientes = []; 

// Cache das opções dos selects (vindas da aba "Filtros" do Sheets)
let opcoesFiltros = {};

// Cache dos dados brutos do Dashboard Analítico
let dashboardRawData = null;

// Cache global para os dados de drill-down dos relatórios (clique nas barras)
// Inicializado com arrays vazios para evitar erros de leitura
window.dadosRelatorioCache = { 
    especialidade: [], 
    procedimento: [],
    lideranca: []
};
