function countByField(arr, field) {
    const counts = {};
    arr.forEach(item => {
        const val = item[field] ? item[field].trim().toUpperCase() : 'N/I';
        counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 10); 
}

function createChart(canvasId, type, labels, data, options) {
    if(chartsInstance[canvasId]) chartsInstance[canvasId].destroy();
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const bg = type === 'bar' ? options.backgroundColor : options.backgroundColor;

    const defaultDatalabels = {
        anchor: 'end', 
        align: 'end',  
        color: '#64748b', 
        font: { weight: 'bold', size: 11 },
        formatter: (value) => value > 0 ? value : '' 
    };

    const userDatalabels = options.plugins && options.plugins.datalabels ? options.plugins.datalabels : {};
    
    const chartOptions = {
        ...options,
        layout: {
            padding: { top: 25, right: 35, left: 0, bottom: 0 }
        },
        plugins: {
            ...options.plugins,
            datalabels: { ...defaultDatalabels, ...userDatalabels }
        }
    };

    chartsInstance[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bg,
                borderWidth: 1
            }]
        },
        options: chartOptions,
        plugins: [ChartDataLabels] 
    });
}

function renderizarGraficos(atendimentos, pacientes) {
    const barOptions = { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } };
    
    const especData = countByField(atendimentos, 'especialidade');
    createChart('chartEspecialidade', 'bar', especData.map(i=>i[0]), especData.map(i=>i[1]), { ...barOptions, backgroundColor: '#3b82f6' });

    const procData = countByField(atendimentos, 'procedimento');
    createChart('chartProcedimento', 'bar', procData.map(i=>i[0]), procData.map(i=>i[1]), { ...barOptions, backgroundColor: '#10b981' });

    const localData = countByField(atendimentos, 'local');
    createChart('chartLocal', 'bar', localData.map(i=>i[0]), localData.map(i=>i[1]), { ...barOptions, backgroundColor: '#8b5cf6' });

    const tipoData = countByField(atendimentos, 'tipo');
    createChart('chartTipo', 'bar', tipoData.map(i=>i[0]), tipoData.map(i=>i[1]), { ...barOptions, backgroundColor: '#f59e0b' });

    const tituloData = countByField(pacientes, 'status_titulo');
    
    const towerOptions = { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }, 
        scales: { y: { beginAtZero: true } }     
    };

    createChart('chartTitulo', 'bar', tituloData.map(i=>i[0]), tituloData.map(i=>i[1]), { 
        ...towerOptions,
        backgroundColor: ['#22c55e', '#ef4444', '#eab308', '#94a3b8', '#3b82f6']
    });
}

function renderizarTorreGenero(pacientes) {
    let masc = 0, fem = 0;
    pacientes.forEach(p => {
        const s = p.sexo ? p.sexo.toUpperCase() : '';
        if(s === 'M' || s === 'MASCULINO') masc++;
        else if(s === 'F' || s === 'FEMININO') fem++;
    });

    const total = masc + fem || 1;
    const pMasc = Math.round((masc / total) * 100);
    const pFem = Math.round((fem / total) * 100);

    document.getElementById('val-masc').innerText = masc;
    document.getElementById('val-fem').innerText = fem;
    
    setTimeout(() => {
        document.getElementById('tower-masc').style.height = `${pMasc}%`;
        document.getElementById('tower-fem').style.height = `${pFem}%`;
    }, 100);
}

function calcularMetricasTempo(atendimentos) {
    const hoje = new Date();
    let totalDiasEspera = 0;
    let countEspera = 0;
    
    let totalDiasMarcacao = 0;
    let countMarcacao = 0;

    atendimentos.forEach(at => {
        if(!at.data_abertura) return;
        const dAbertura = new Date(at.data_abertura);
        
        if(at.status === 'PENDENTE') {
            const diffTime = Math.abs(hoje - dAbertura);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            totalDiasEspera += diffDays;
            countEspera++;
        } else if (at.data_marcacao) {
            const dMarcacao = new Date(at.data_marcacao);
            const diffTime = Math.abs(dMarcacao - dAbertura);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            totalDiasEspera += diffDays;
            countEspera++;

            totalDiasMarcacao += diffDays;
            countMarcacao++;
        }
    });

    const mediaEspera = countEspera > 0 ? Math.round(totalDiasEspera / countEspera) : 0;
    const mediaMarcacao = countMarcacao > 0 ? Math.round(totalDiasMarcacao / countMarcacao) : 0;

    document.getElementById('dash-tempo-espera').innerText = mediaEspera;
    document.getElementById('dash-tempo-marcacao').innerText = mediaMarcacao;
    document.getElementById('dash-tempo-total').innerText = mediaEspera;
}
