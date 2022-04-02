if (!new MobileDetect(window.navigator.userAgent).mobile()) {
    const cnf = new YapaConfig()
    cnf.nodeColor = "#999"
    cnf.connColor = "#888"
    cnf.connLineWidth = .8;
    cnf.nodeRadius = 1.4;
    cnf.fadeInDurationMs = 4000;
    cnf.maxConnDistance = 280;
    cnf.nodeDensityFactor = .8;
    cnf.nodeVelocityFactor = .14;
    cnf.maxConnDistance = 160;
    cnf.transmissionSpeedFactor = 2;
    cnf.transmissionSpawnPeriodMaxMs = 6000;
    cnf.transmissionWidthFactor = 1.6;
    cnf.transmissionsEnabled = false;
    new Yapa(document.getElementById("yapa_l"), cnf).start();
    new Yapa(document.getElementById("yapa_r"), cnf).start();
    setTimeout(() => cnf.transmissionsEnabled = true, 5000);
}
