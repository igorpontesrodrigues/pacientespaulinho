/**
 * js/main.js
 * Ponto de entrada da aplicação.
 * Inicializa bibliotecas e configura eventos globais.
 */

window.onload = function() {
    // 1. Inicializa ícones (Lucide)
    if(typeof lucide !== 'undefined') lucide.createIcons();

    // 2. Define valores padrão nos formulários (Data de hoje, Mês atual)
    const dataAbertura = document.getElementById('data_abertura');
    if(dataAbertura) dataAbertura.valueAsDate = new Date();

    const filtroNiver = document.getElementById('filtro-niver-mes');
    if(filtroNiver) filtroNiver.value = new Date().getMonth() + 1; 

    // 3. Renderiza a estrutura vazia dos selects (loading state)
    if(typeof renderizarSelectsVazios === 'function') renderizarSelectsVazios();

    // 4. Busca as opções do Google Sheets para preencher os selects
    if(typeof carregarFiltros === 'function') carregarFiltros();

    // NOTA: Não chamamos switchTab('dashboard') aqui.
    // O sistema inicia com a tela de login (index.html) sobreposta a tudo.
    // A função iniciarSistema() no js/ui.js será chamada após o login bem-sucedido.
};


// ============================================================================
// EVENT LISTENERS GLOBAIS
// ============================================================================

// 1. Monitora digitação nos inputs de "Cadastrar Novo" (switched-input)
document.addEventListener('input', function(e) {
    if(e.target.classList.contains('switched-input')) {
        const id = e.target.id.replace('inp_', '');
        const hiddenField = document.getElementById(`field_${id}`);
        if(hiddenField) {
            // Garante que o valor salvo seja sempre maiúsculo
            hiddenField.value = e.target.value.toUpperCase();
        }
    }
});

// 2. Monitora mudanças em campos que afetam a Data de Risco
// Se mudar a especialidade (Ex: Oftalmologia) ou a data de marcação, recalcula o prazo.
document.addEventListener('change', function(e) {
    const idsMonitorados = ['sel_especialidade', 'inp_especialidade', 'field_data_marcacao'];
    
    if(idsMonitorados.includes(e.target.id)) {
        // Pequeno delay para garantir que o valor do select já tenha ido para o hidden field
        if(typeof calcularDataRisco === 'function') {
            setTimeout(calcularDataRisco, 100);
        }
    }
});
