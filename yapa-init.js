if (!new MobileDetect(window.navigator.userAgent).mobile()) {
    const cnf = new YapaConfig()
    cnf.nodeColor = "#999"
    cnf.connColor = "#888"
    cnf.connLineWidth = .8;
    cnf.nodeRadius = 1.4;
    cnf.fadeInDurationMs = 3000;
    cnf.maxConnDistance = 140;
    cnf.nodeDensityFactor = 1.2;
    cnf.nodeVelocityFactor = .2;
    cnf.transmissionSpeedFactor = 3.0;
    cnf.transmissionSpawnPeriodMaxMs = 2500;
    cnf.transmissionWidthFactor = 1.4;
    cnf.transmissionsEnabled = false;
    new Yapa(document.getElementById("yapa_l"), cnf).start();
    new Yapa(document.getElementById("yapa_r"), cnf).start();
    setTimeout(() => cnf.transmissionsEnabled = true, 5000);
}
