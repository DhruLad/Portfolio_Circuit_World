/*
  content.js: every word and fact shown in the game lives here.
  To add a project, copy one block inside `projects`, change the text, save.
  The board, the project panels, the map and Quick View all rebuild from this file.

  Fields per project:
    id        unique, lowercase-with-dashes; names the photo folder and the deep link (#id)
    category  which district it sits in. A new category makes a new district on the board.
    zone      short name shown on the board (keep it under about 18 characters)
    title, date, org, summary
    story     { problem, action, why, result }: the "How I approached it" walkthrough.
              A blank line (\n\n) inside a field starts a new paragraph.
    results   short result chips
    skills    tool and skill chips

  Optional:
    sprite  building art: "opamp", "ring", "oscilloscope", "cpu", "fpga", "adc", "brain",
            "shield", "rocket", "garage", "motor", "pylon", "dome", "camera", "arm",
            "humanoid", "gripper", "server", "monitor", "globe", "factory", "switchgear".
            Anything else (or nothing) draws a plain chip.
    demo    mini-demo from js/demos.js: "bode", "vco", "waveforms", "pipeline", "adder",
            "sar", "sensors", "rocket", "robot", "motor", "models", "feeders".
    photos  file names inside assets/projects/<id>/
    links   [{ label: "Code", url: "https://..." }]
*/
window.PORTFOLIO = {
  profile: {
    name: "Dhru Lad",
    tagline: "Electrical Engineering & Artificial Intelligence Systems Engineering, Western University",
    location: "Toronto, ON",
    linkedin: "https://www.linkedin.com/in/dhru-lad/",
    email: "",            // TODO: add the address you want public, e.g. "you@example.com"
    resume: "",           // TODO: add "assets/resume.pdf" once a public copy (no phone number) is in that folder
    education: {
      school: "University of Western Ontario, London, ON",
      degree: "Bachelor of Electrical Engineering & Artificial Intelligence Systems Engineering",
      dates: "September 2022 – April 2028",
      coursework: "Digital Logic, Microprocessors, Electronic Systems Design, Circuit Theory, Control Systems, Data Engineering & Machine Learning, Deep Learning"
    },
    awards: [
      "Dean's Honor List (2026)",
      "Wellington Financial LP Award in Technology Evaluation and Analysis (2026)",
      "Western Engineering Diversity Ambassador Award (2026)"
    ],
    skills: [
      { group: "Analog & mixed-signal", items: "SKY130, ngspice, Xschem, Magic, Micro-Cap (SPICE), EAGLE, Altium Designer" },
      { group: "Digital design & verification", items: "Verilog, SystemVerilog, UVM, SVA, Verilator, Intel Quartus Prime, Tcl" },
      { group: "Embedded & hardware", items: "C/C++, Arduino, ESP32, I2C, UART, PCB Design & Layout, Power Electronics, Oscilloscope-Based Validation & Debug, SolidWorks" },
      { group: "Machine learning & robotics", items: "PyTorch, TensorFlow/Keras, JAX, scikit-learn, Optuna, MuJoCo, MJX, CLIP" },
      { group: "Software", items: "Python, React/TypeScript, Node.js, PostgreSQL, Docker, Git, VB.NET, MySQL, AutoCAD" }
    ],
    experience: [
      { role: "Avionics Lead Engineer", org: "Western Engineering Rocketry Team, London", dates: "Sept 2023 – Present",
        line: "Designed and tested avionics systems for high-powered rockets, raising system reliability by 40%, validated over two full-scale launches." },
      { role: "Field Engineering Intern", org: "EllisDon & PCL, Parliament of Canada, Ottawa", dates: "Sept 2024 – Sept 2026",
        line: "Analyzed mechanical and electrical drawings to resolve 150+ deficiencies a month and coordinated field activities for 20+ subcontractors." },
      { role: "Sustainability Commissioner", org: "Undergraduate Engineering Society, London", dates: "May 2026 – Present",
        line: "Plans wellness and professional development initiatives for undergraduate engineering students." },
      { role: "Residence Don (Upper-Year)", org: "Western University Housing, London", dates: "Aug 2026 – Present",
        line: "Leads a residence community of 85 upper-year students across 3 floors." },
      { role: "Residence Education Advisor", org: "Western University Housing, London", dates: "Aug 2025 – May 2026",
        line: "Designed and ran 10+ academic and leadership programs for a 350-resident building." },
      { role: "Donor Relations & Events Planning Coordinator", org: "Canadian Blood Services, London", dates: "Apr 2024 – Sept 2024",
        line: "Planned 100+ community recruitment events and registered 5,000+ new donors." }
    ]
  },

  projects: [
    /* ---------------- Analog and mixed-signal circuits ---------------- */
    {
      id: "cmos-opamp",
      category: "Analog and mixed-signal circuits",
      zone: "Op-Amp Fab",
      title: "CMOS Two-Stage Op-Amp, Schematic to Layout",
      date: "Nov 2026 – Present",
      summary: "A Miller-compensated two-stage op-amp in the SKY130 open PDK, taken from specification through layout and post-layout simulation.",
      story: {
        problem: "I wanted to take an analog block from specification all the way through layout in an open PDK. The block was an op-amp driving a 2 pF load. It had to stay stable across process, voltage and temperature, and still meet spec once layout parasitics were added.",
        action: "I sized a Miller-compensated two-stage op-amp with the gm/ID method and biased it from a beta-multiplier current reference. I wrote Python scripts to run ngspice AC, transient, noise and stability sweeps over 15 PVT corners (−40 to 125 °C, ±10% VDD) and 200 Monte Carlo runs. Then I drew the layout in Magic with a common-centroid input pair, dummies and guard rings, passed DRC and LVS, and re-simulated with extracted parasitics.",
        why: "I chose two stages because the first gives gain and the second adds gain with a wide output swing, which one stage struggles to do on a low supply. Two high-impedance nodes mean two poles close together, so I used a Miller capacitor to split them and make one dominant. I sized with gm/ID because square-law hand equations are unreliable in a short-channel process, and simulated gm/ID curves let me pick each transistor's speed-versus-efficiency trade-off directly.\n\nThe beta-multiplier makes the bias current depend on a resistor and a device ratio rather than on the supply. I scripted the sweeps because 15 corners times four analyses is too many to run by hand without missing one. I used a common-centroid input pair because offset comes from mismatch, and that layout cancels linear gradients across the die.",
        result: "72 dB DC gain, 28 MHz unity-gain bandwidth, 62° phase margin and 21 nV/√Hz input noise, at 410 µW. Phase margin stayed above 55° and offset sigma below 2 mV across every corner and Monte Carlo run. Layout cost me 9% of the bandwidth, so I retuned the compensation in extracted simulation and brought phase margin back above 60°."
      },
      results: ["72 dB DC gain", "28 MHz unity-gain bandwidth", "62° phase margin", "21 nV/√Hz input noise", "410 µW", "PM > 55° over 15 PVT corners + 200 Monte Carlo runs"],
      skills: ["SKY130", "ngspice", "Xschem", "Magic", "Python"],
      sprite: "opamp",
      demo: "bode",
      photos: [],
      links: []
    },
    {
      id: "ring-vco",
      category: "Analog and mixed-signal circuits",
      zone: "VCO Ring",
      title: "Current-Starved Ring-Oscillator VCO",
      date: "Nov 2026 – Present",
      summary: "A 5-stage current-starved ring oscillator in SKY130, with its tuning range, jitter and drift measured in simulation.",
      story: {
        problem: "A clock generator needs an oscillator whose frequency follows a control voltage over a wide range. I wanted to design one and then put numbers on its jitter and its drift, because those decide whether a VCO is usable.",
        action: "I built a 5-stage current-starved ring oscillator: an inverter chain where current-mirror devices limit how much current each stage can draw. I sized the inverters and the starving devices to balance tuning range, power and output swing. Then I ran transient-noise simulations and wrote a Python script that finds the zero crossings, builds the period histogram and extracts RMS jitter.",
        why: "I chose a ring oscillator because it needs no inductor, so it is compact and tunes over a wide range. The cost is more jitter than an LC oscillator, which is why I measured jitter rather than assuming it. Current starving works because stage delay is roughly capacitance times swing over current, so frequency follows the control current almost linearly.\n\nSizing was a three-way trade. Starving the stages harder widens the range at the low end, but the output swing collapses and the edges slow down. I extracted jitter from zero crossings because period jitter is, by definition, the variation in time between edges.",
        result: "A 0.6 to 2.4 GHz tuning range with a near-linear gain of about 2 GHz/V at 1.8 V. Period jitter was 1.4 ps RMS, and frequency drifted ±7% across PVT corners."
      },
      results: ["0.6–2.4 GHz tuning range", "≈2 GHz/V near-linear gain", "1.4 ps RMS period jitter", "±7% drift across PVT"],
      skills: ["SKY130", "ngspice", "Python/NumPy"],
      sprite: "ring",
      demo: "vco",
      photos: [],
      links: []
    },
    {
      id: "function-generator",
      category: "Analog and mixed-signal circuits",
      zone: "Signal Lab",
      title: "Function Generator, from Hand Analysis to a Working Board",
      date: "Jan 2025",
      summary: "A sine, square and triangle function generator for lab testing, taken from hand analysis and SPICE to a soldered, working PCB.",
      story: {
        problem: "In the lab we needed a signal source to test other circuits. I designed a function generator with sine, square and triangle outputs, and it had to be accurate enough to trust as a test input.",
        action: "I designed the analog oscillator and wave-shaping stages by hand, then simulated them in Micro-Cap SPICE across several frequency ranges. I did the schematic capture and PCB layout in EAGLE, soldered the board, and brought it up with an oscilloscope and a multimeter.",
        why: "I started with hand analysis because I wanted to know which components set the frequency and amplitude before I trusted a simulator. Then I ran SPICE, because hand analysis assumes ideal parts and simulation shows how real component behaviour moves the waveform. I did both before fabrication because a simulation rerun takes seconds and a board respin takes days.\n\nAt bring-up I checked every output on the scope. Soldering and layout faults only show up on the real board, so that is where the design has to be proven.",
        result: "All three waveforms came out within ±5% of the design values, up to 10 kHz, as measured on the oscilloscope. The project went from concept to a fully working prototype."
      },
      results: ["Within ±5% of design values", "Up to 10 kHz", "Concept to working prototype"],
      skills: ["Micro-Cap SPICE", "EAGLE", "PCB layout", "Soldering", "Oscilloscope"],
      sprite: "oscilloscope",
      demo: "waveforms",
      photos: [],
      links: []
    },

    /* ---------------- Digital design and verification ---------------- */
    {
      id: "riscv-core",
      category: "Digital design and verification",
      zone: "RISC-V Core",
      title: "Pipelined RISC-V (RV32I) CPU Core",
      date: "Oct 2026 – Present",
      summary: "A 5-stage RV32I pipeline in SystemVerilog with hazard handling, verified by a self-checking random testbench over 2,000+ seeds.",
      story: {
        problem: "I wanted to build a processor that is both fast and demonstrably correct, not one that only runs a demo program. A pipeline makes both hard. Instructions overlap, so data and control hazards create bugs that appear only in specific instruction sequences.",
        action: "I designed a 5-stage RV32I pipeline in SystemVerilog with data forwarding, load-use hazard detection and branch flush. I wrote a verification test plan, then a self-checking testbench with constrained-random programs, SVA assertions and a Python reference model. A Python regression flow on Linux runs 2,000+ random seeds through Verilator, triages the failures and dumps waveforms. For speed, I re-pipelined the critical paths that static timing analysis reported.",
        why: "Forwarding handles most data hazards by routing a result straight back to Execute instead of waiting for write-back. The one case it cannot fix is a load followed immediately by a use, because the data has not left memory yet, so that case gets a one-cycle stall. A branch is decided after later instructions were already fetched, so those get flushed.\n\nI could not hand-write every instruction sequence, so I generated random programs and compared the RTL against a reference model, which makes any random program self-checking. Assertions catch a bug in the cycle it happens rather than thousands of cycles later. I used Verilator because it is fast enough to make thousands of seeds practical.",
        result: "Timing closed at 75 MHz on an Intel FPGA with a CPI of 1.19 on RV32I benchmarks. I reached 100% RV32I instruction coverage and 96% functional coverage. The regression found 12 RTL bugs, and I fixed all of them before FPGA deployment."
      },
      results: ["75 MHz timing closure", "CPI 1.19", "100% RV32I instruction coverage", "96% functional coverage", "12 RTL bugs found and fixed"],
      skills: ["SystemVerilog", "Verilator", "SVA", "Python", "Tcl", "Intel FPGA"],
      sprite: "cpu",
      demo: "pipeline",
      photos: [],
      links: []
    },
    {
      id: "fpga-logic",
      category: "Digital design and verification",
      zone: "Logic Fortress",
      title: "Digital Control System in Verilog on an FPGA",
      date: "Dec 2025",
      summary: "A modular control system of state machines, counters, registers and I/O, simulated first and then proven on an FPGA board.",
      story: {
        problem: "The task was a modular digital control system on an FPGA board: state machines, counters, registers and hardware I/O working together. The risk with FPGA work is debugging on the board, where I can see only the pins.",
        action: "I wrote the building blocks in Verilog: adders, multiplexers, counters, registers and finite-state machines. I simulated them, read the waveforms, and fixed timing and logic errors before synthesis. I wrote Tcl scripts for the pin assignments and the Quartus compile flow, then programmed the board and tested the I/O in every operating state.",
        why: "I kept the design modular so each block could be verified alone. When the full system misbehaved, I knew the blocks were good and looked at how they were connected. I simulated before synthesis because a waveform shows every internal signal on every clock edge, and the board shows only outputs.\n\nI scripted the build in Tcl because pin assignments entered by hand in the GUI are slow and easy to get wrong, and a script runs the same way every time. I still tested on hardware in every state, because some timing and logic problems appeared only on real I/O. I fixed those by going back to the RTL.",
        result: "The design ran correctly on the FPGA across all operating states. The Tcl scripts reduced a multi-step manual build to a single command."
      },
      results: ["Correct across all operating states", "Build reduced to a single command"],
      skills: ["Verilog", "Intel Quartus Prime", "Tcl", "Finite state machines", "RTL simulation"],
      sprite: "fpga",
      demo: "adder",
      photos: [],
      links: []
    },
    {
      id: "adc-pll-uvm",
      category: "Digital design and verification",
      zone: "ADC & PLL Models",
      title: "Behavioral Models and a UVM Testbench for a SAR ADC and a Charge-Pump PLL",
      date: "Sep – Oct 2026",
      summary: "Fast real-number models of a 10-bit SAR ADC and a charge-pump PLL, held to SPICE accuracy and verified inside a UVM testbench.",
      story: {
        problem: "Mixed-signal chips contain analog blocks such as ADCs and PLLs that are far too slow to simulate in SPICE next to the digital logic. Without fast models of those blocks, the digital side cannot be verified before silicon.",
        action: "I wrote event-driven real-number models in SystemVerilog for a 10-bit SAR ADC and a charge-pump PLL, and checked them against SPICE references. Around them I built a UVM testbench with agents, a driver, a monitor and a scoreboard, using constrained-random stimulus, assertions and covergroups. I wrote a verification plan that traces 30+ spec features to tests, coverage points and checkers, tracked the regressions, and logged bugs to closure.",
        why: "A real-number model keeps the analog value as a real number but updates only on events, so it runs at digital-simulation speed. Speed is worthless if the model is wrong, so I set a tolerance against SPICE and held the models to it. I used UVM because its structure is reusable: the same driver and monitor serve every test, and only the sequences change.\n\nThe blocks have 12 operating modes, and I would not think of every combination by hand, so I randomized the stimulus and let covergroups tell me what was actually reached. Full coverage only shows that I exercised the design. To show the checkers would notice a failure, I injected bugs on purpose.",
        result: "The models matched SPICE within ±0.5 LSB for the ADC and ±1% of lock frequency for the PLL. The testbench reached 100% functional coverage across 12 operating modes and caught 6 injected bugs."
      },
      results: ["ADC within ±0.5 LSB of SPICE", "PLL within ±1% of lock frequency", "100% functional coverage, 12 modes", "Caught 6 injected bugs"],
      skills: ["SystemVerilog", "UVM", "SVA", "Real-number modeling"],
      sprite: "adc",
      demo: "sar",
      photos: [],
      links: []
    },
    {
      id: "ai-testbench",
      category: "Digital design and verification",
      zone: "Coverage Engine",
      title: "AI-Driven Testbench Generation for Mixed-Signal Calibration",
      date: "Oct 2026 – Present",
      summary: "A Python framework that generates UVM tests from the spec and steers stimulus toward uncovered bins, lifting coverage from 68% to 97%.",
      story: {
        problem: "A multi-mode RF calibration controller handles DC offset, I/Q imbalance and VCO band select, and those flows depend on each other and on the register configuration. Functional and scenario coverage stood at 68%. The gap was in combinations of modes, which is where corner-case bugs hide.",
        action: "I built a Python framework that generates UVM sequences and constrained-random scenarios automatically. A RAG pipeline over the spec documents and register maps helped me map 40+ calibration flows, operating modes and configuration dependencies into cross-coverage bins and SVA assertions. I trained a scikit-learn model on 5K+ simulation logs to prioritize stimulus for uncovered bins, and I clustered failures with pandas.",
        why: "The dependencies live in the spec, and reading it by hand is where they get missed. Retrieval pulls the relevant passages for each flow, so each coverage bin traces back to a spec statement. I used cross-coverage because these bugs are not in one mode; they are in the interaction of two.\n\nPure random stimulus spends most of its runs hitting bins that are already covered. A model trained on past logs spends the simulation budget on what is still missing. I clustered failures because one root cause produces many failing seeds, and I only want to debug it once.",
        result: "Coverage rose from 68% to 97%. Regression cycles got 35% shorter, three corner-case bugs were exposed, and triage time was cut in half."
      },
      results: ["Coverage 68% → 97%", "Regression cycles 35% shorter", "3 corner-case bugs exposed", "Triage time halved"],
      skills: ["Python", "SystemVerilog", "UVM", "RAG", "scikit-learn", "pandas"],
      sprite: "brain",
      photos: [],
      links: []
    },

    /* ---------------- Boards, embedded systems and hardware ---------------- */
    {
      id: "pcb-shield",
      category: "Boards, embedded systems and hardware",
      zone: "Shield Workshop",
      title: "Mixed-Signal PCB: Arduino Sensor and Actuator Shield",
      date: "Jan 2026",
      summary: "A single-layer shield that connects an Arduino UNO to 11 peripherals, with an isolated 12 V solenoid rail and data streamed to an ESP32 web server.",
      story: {
        problem: "I had to connect an Arduino UNO to 11 peripherals on a single-layer board. Two things made that hard. With one copper layer, traces cannot cross. And the solenoids run from a 12 V, 2 A rail that could disturb or damage the logic.",
        action: "I designed a custom shield in Altium Designer with 45° trace routing, thermal pads and external ground-plane bridges. I isolated the 12 V solenoid rail with optocoupled relays and added resistive voltage dividers to stop sensors overheating. After soldering the through-hole parts, I found power shorts and open traces by cross-referencing the schematic and continuity testing. Then I wrote C++ firmware to read five sensor types and send the data over UART to an ESP32 web server.",
        why: "A solenoid is an inductive load on a higher-voltage rail. With an optocoupler, the only link between that rail and the microcontroller is light, so switching noise or a fault has no electrical path into the logic. On a single layer some nets have to cross, so I planned external bridges as deliberate jumpers instead of forcing long detours. Thermal pads keep a joint from losing its heat into a large copper area, which makes hand soldering reliable.\n\nWhen the board did not work, I tested continuity against the schematic rather than guessing. That splits the problem cleanly: either the copper matches the schematic or it does not. I sent the data to an ESP32 because the UNO has no network connection, so the UNO reads sensors and the ESP32 serves the web page.",
        result: "All 11 peripherals worked on a single-layer board, the solenoid rail stayed isolated from the logic, and readings from five sensor types streamed to the ESP32 web server."
      },
      results: ["11 peripherals on one single-layer board", "12 V solenoid rail isolated", "5 sensor types streaming to ESP32"],
      skills: ["Altium Designer", "C++", "Arduino", "ESP32", "UART", "Soldering"],
      sprite: "shield",
      demo: "sensors",
      photos: [],
      links: []
    },
    {
      id: "flight-computer",
      category: "Boards, embedded systems and hardware",
      zone: "Launch Pad",
      title: "Flight Computer Obsolescence Redesign and Automated Test Fixture",
      date: "Oct 2026",
      org: "Western Engineering Rocketry Team",
      summary: "Replaced an end-of-life barometric sensor on the rocket's flight computer and proved the swap with an automated side-by-side test fixture.",
      story: {
        problem: "Our flight computer used a BMP180 barometric sensor, and the part went end-of-life. We could no longer rely on supply. A flight computer depends on its barometer for altitude, so I could not drop in a replacement without proving it behaved the same.",
        action: "I qualified the BMP390 as the replacement by comparing specs, footprint and I2C registers. I updated the schematic, PCB and BOM through a change record. Then I built a Python and Arduino test fixture that logs both sensors side by side and flags out-of-tolerance readings, and I ran it for 30 bench cycles.",
        why: "A replacement part can fail in three ways: its performance differs, it does not fit the board, or the firmware talks to it wrongly. Specs, footprint and register map cover those three. I used a change record because one substitution touched the schematic, the layout and the BOM. If any one of them is missed, the next board gets built wrong.\n\nI automated the comparison instead of spot-checking. Form-fit-function equivalence is a claim about many readings, and a script applies the same tolerance to every one of them.",
        result: "The BMP390 matched the BMP180 within ±0.5 hPa over 30 bench cycles, and part supply for the flight computer was restored."
      },
      results: ["BMP390 within ±0.5 hPa of BMP180", "30 bench cycles", "Part supply restored"],
      skills: ["Component qualification", "I2C", "Change control", "Python", "Arduino"],
      sprite: "rocket",
      demo: "rocket",
      photos: [],
      links: []
    },
    {
      id: "autonomous-robot",
      category: "Boards, embedded systems and hardware",
      zone: "Robot Garage",
      title: "Autonomous Robot: Navigation, Retrieval and Sorting",
      date: "Jan 2026",
      summary: "A robot that drives a course on its own, avoids obstacles, picks up objects, sorts the valuable ones and homes back.",
      story: {
        problem: "The robot had to drive itself around a course, avoid obstacles, pick up objects, decide which ones were valuable, sort them and find its way home, all with nobody touching it.",
        action: "I built it on an Arduino in C++. Ultrasonic and IR sensors feed real-time navigation, obstacle avoidance and closed-loop lane-keeping. Servo-driven manipulators handle retrieval and sorting, DC motors drive the wheels, and I modelled the mechanical assemblies in SolidWorks. I also designed the power-distribution and motor-control subsystem, selecting the voltage regulation, driver circuitry and protection components.",
        why: "I used two kinds of sensor because each covers what the other is poor at: ultrasonic gives range to an obstacle, and IR handles close-range detection. I closed the loop on lane-keeping because open-loop driving drifts. Wheels slip and motors are never perfectly matched, so the robot has to keep correcting from what it senses.\n\nI designed the power stage myself because motors and servos draw large, changing currents. If that pulls the supply down, the Arduino resets or the sensors misread, and the fault looks like a software bug. Regulation and protection keep the logic steady while the load changes.",
        result: "The robot sorted valuable from non-valuable objects with 100% accuracy, and it traversed the course, avoided obstacles and homed autonomously."
      },
      results: ["100% sorting accuracy", "Autonomous traversal, avoidance and homing"],
      skills: ["Arduino", "C++", "Python", "SolidWorks", "Motor control", "Sensor integration"],
      sprite: "garage",
      demo: "robot",
      photos: [],
      links: []
    },
    {
      id: "bldc-motor",
      category: "Boards, embedded systems and hardware",
      zone: "Motor Works",
      title: "Custom BLDC Motor: Design, Build and Test",
      date: "Dec 2025",
      summary: "A brushless DC motor designed from first principles inside a 15 V, 5 A, 75 W envelope, then printed, built and tested.",
      story: {
        problem: "I had to design and build a brushless DC motor from scratch inside a fixed electrical envelope: 15 V, 5 A and 75 W. The difficulty is that speed and torque pull in opposite directions from the same winding.",
        action: "I calculated the motor constants Kv and Kt from first principles and chose the number of winding turns to fit the voltage and current limits. I built the magnetic circuit around N52 magnets with a wye winding configuration. I designed the mechanical parts in SolidWorks, 3D printed them, assembled the motor and tested it.",
        why: "Kv and Kt are two views of the same quantity. More turns give more torque per amp but less speed per volt. With voltage capped at 15 V and current at 5 A, the turns count is the main lever, so I calculated it instead of winding by trial and error.\n\nI chose N52 magnets because a stronger magnet gives more flux, and more flux gives more torque for the same current. I connected the phases in wye so no current can circulate around the winding loop, as it can in delta. I 3D printed the mechanical parts so I could change a part and test again quickly.",
        result: "The motor reached a peak speed of 3,000 RPM and 0.12 N·m of torque at 63% efficiency, within the 15 V, 5 A, 75 W limits. Cogging torque dropped by 40%, which made startup smoother."
      },
      results: ["3,000 RPM peak", "0.12 N·m torque", "63% efficiency", "Cogging torque down 40%"],
      skills: ["Motor design", "Electromagnetics", "SolidWorks", "3D printing"],
      sprite: "motor",
      demo: "motor",
      photos: [],
      links: []
    },

    /* ---------------- Machine learning and forecasting ---------------- */
    {
      id: "load-forecast",
      category: "Machine learning and forecasting",
      zone: "Grid Forecast",
      title: "Day-Ahead Electricity Load Forecasting",
      date: "Nov 2026",
      summary: "Hourly 24-hour-ahead load forecasts for a distribution zone, with six neural architectures held to one leak-free protocol and a 139 kB deployable model.",
      story: {
        problem: "I had to forecast the next 24 hours of electricity demand for a distribution zone in Tetouan, Morocco, every hour, from 52K ten-minute power readings. The trap in time-series work is leakage. If the model sees the future during training, the results look excellent and mean nothing.",
        action: "I built the pipeline around a time-ordered split, fitted the preprocessing on training data only, and used rolling-origin cross-validation. I compared six neural architectures (MLP, CNN, SimpleRNN, LSTM, GRU, TCN) against linear and seasonal-naive baselines under one shared training protocol. I added a residual anchor so each network learns corrections to yesterday's load profile. I owned evaluation and test reporting, exported the final model to TensorFlow Lite, and built checkpointing plus a smoke test that rebuilds forecasts from raw data.",
        why: "Load repeats daily, so \"same as yesterday\" is already a decent forecast. A network has to beat that baseline to justify its cost. I held every model to one protocol so that differences come from the architecture, not from one model getting more tuning.\n\nThe anchor exists because a small correction is easier to learn than a whole curve; the network starts from a good answer. I built the reproducibility tooling because a comparison of eight models is only credible if anyone can rerun it and get the same numbers.",
        result: "On the held-out test set, the tuned models had 16–23% lower RMSE than the seasonal-naive baseline. The anchor lowered validation error by 9–28% across the sequence models. I traced a consistent winter over-forecast to two causes: the training data covered only January to August, and the inputs did not mark holidays.\n\nThe TensorFlow Lite model is 139 kB and within 2.3 kW of the full model. Retraining all 90 networks from scratch reproduced every result exactly."
      },
      results: ["16–23% lower RMSE than seasonal-naive", "Residual anchor: 9–28% lower validation error", "139 kB TFLite model, within 2.3 kW", "All 90 networks reproduced exactly"],
      skills: ["Python", "TensorFlow/Keras", "scikit-learn", "TensorFlow Lite", "Git"],
      sprite: "pylon",
      photos: [],
      links: []
    },
    {
      id: "housing-forecast",
      category: "Machine learning and forecasting",
      zone: "Data Observatory",
      title: "Predictive Analysis of U.S. Housing Markets",
      date: "Sep 2025",
      summary: "RNN, GRU and TCN models compared against SARIMA baselines to forecast monthly U.S. construction permits on sparse, noisy data.",
      story: {
        problem: "I wanted to forecast monthly U.S. construction permits. The data is sparse and high-variance: few points per series and large swings. That is the regime where deep models often lose to classical statistics.",
        action: "I built a supervised deep learning framework in Python that compares RNN, GRU and Temporal Convolutional Network architectures against SARIMA baselines. I ran Bayesian hyperparameter optimization with Keras Tuner and Optuna on T4 GPUs.",
        why: "SARIMA is the standard model for seasonal monthly series, and with little data it is hard to beat, so it was the honest baseline. I tried three architectures because they handle history differently. An RNN and a GRU carry a hidden state forward one step at a time, while a TCN looks at a fixed window through dilated convolutions.\n\nI used Bayesian search instead of a grid because small, noisy datasets make results very sensitive to hyperparameters, and every trial costs GPU time. Bayesian optimization uses the trials already run to choose the next one.",
        result: "The tuned TCN excelled on the sparse, high-variance data and outperformed the SARIMA baselines."
      },
      results: ["Tuned TCN outperformed SARIMA baselines"],
      skills: ["Python", "Keras", "Keras Tuner", "Optuna", "Time-series forecasting"],
      sprite: "dome",
      demo: "models",
      photos: [],
      links: []
    },
    {
      id: "video-qa",
      category: "Machine learning and forecasting",
      zone: "Video Lab",
      title: "Video State-Tracking and Question Answering: Recurrent versus Attention",
      date: "Oct 2026 – Present",
      summary: "A controlled comparison of recurrent and attention-based temporal models on synthetic multi-object videos, including clips four times longer than training.",
      story: {
        problem: "When a model watches a video and has to keep track of objects, does it matter whether its temporal part is recurrent or attention-based? I wanted to know what happens on videos longer than anything seen in training, and when training data is scarce.",
        action: "I generated 20K synthetic multi-object videos. Every model shares the same CNN frame encoder, and only the temporal head changes: ConvGRU, LSTM or Transformer. For question answering, I fused a GRU text encoder with the visual features through cross-attention. All models trained under one protocol: AdamW, cosine learning rate, mixed precision and five seeds.",
        why: "I used synthetic data because I control the ground truth and the clip length, so I can test on clips exactly four times longer than training. I shared the encoder and the protocol so the only variable is the inductive bias of the temporal head. I ran five seeds so that a difference is not one lucky run.\n\nMy hypothesis was that a recurrent model applies the same update rule at every frame, so it should extend to longer videos. A Transformer attends over positions it saw in training and has no built-in reason to extrapolate beyond them.",
        result: "On clips four times longer than training, the gated recurrent model reached 91% against 58% for the Transformer, a 33-point gap. It matched the Transformer's full-data accuracy using only 40% of the training clips. The question-answering model reached 84% on counting and spatial-relation questions."
      },
      results: ["91% vs 58% on 4× longer clips", "Same accuracy with 40% of the data", "84% on counting and spatial questions"],
      skills: ["PyTorch", "ConvGRU", "LSTM", "Transformers", "Cross-attention"],
      sprite: "camera",
      photos: [],
      links: []
    },

    /* ---------------- Robot learning ---------------- */
    {
      id: "arm-rl",
      category: "Robot learning",
      zone: "Arm Gym",
      title: "Robotic Manipulation with Reinforcement Learning and Sim2Real Transfer",
      date: "Jul – Aug 2026",
      summary: "A PPO pick-and-place policy for a simulated 7-DoF arm, made robust to unseen physics with domain randomization and demonstration pretraining.",
      story: {
        problem: "I wanted to teach a simulated 7-DoF robot arm to pick and place, and to make the policy survive conditions it was not trained on. A policy that only works in its own simulator will not transfer to a real robot.",
        action: "I trained a PPO actor-critic policy with dense reward shaping and observation normalization. I applied domain randomization over object dynamics, friction and actuator latency. I also pretrained the policy with behaviour cloning on 200 demonstrations.",
        why: "PPO limits how far each update can move the policy, which keeps training stable for continuous control. I shaped a dense reward because with a sparse success signal the arm almost never completes a pick-and-place by chance, so it has nothing to learn from. I normalized observations because joint angles and positions sit on different scales.\n\nI randomized the physics because real mass and friction will never match the simulator. If the policy trains across a range, the real values are just one more sample. I pretrained on demonstrations so that PPO starts near sensible behaviour and spends its steps refining instead of exploring from scratch.",
        result: "The policy reached an 87% pick-and-place success rate over 500 evaluation episodes. Under unseen ±25% mass and friction shifts, domain randomization raised success from 52% to 81%. Behaviour-cloning pretraining cut the environment steps to convergence by 40%."
      },
      results: ["87% success over 500 episodes", "52% → 81% under ±25% physics shifts", "40% fewer steps to converge"],
      skills: ["PyTorch", "MuJoCo", "PPO", "Domain randomization", "Behaviour cloning"],
      sprite: "arm",
      photos: [],
      links: []
    },
    {
      id: "humanoid-rl",
      category: "Robot learning",
      zone: "Humanoid Park",
      title: "Humanoid Locomotion and Dexterous Manipulation with Deep RL",
      date: "Nov 2026 – Present",
      summary: "Whole-body PPO control for a simulated Unitree G1 humanoid and a 16-DoF LEAP hand, trained on thousands of GPU-parallel environments.",
      story: {
        problem: "I wanted to train whole-body control for a humanoid and for a dexterous hand with reinforcement learning. Both are high-dimensional and full of contact, so they need an enormous number of simulation steps.",
        action: "I trained an end-to-end PPO policy for full-body locomotion on a simulated Unitree G1 that tracks joystick velocity commands, running thousands of parallel MJX environments on a single GPU. I added domain randomization over friction, link mass, actuator gains and sensor noise, and shaped rewards for foot clearance, gait regularity and torque cost. I then adapted the same pipeline to a 16-DoF LEAP hand, using proprioceptive and object-pose inputs. I validated both policies sim-to-sim in CPU MuJoCo.",
        why: "PPO is on-policy and hungry for samples, so throughput decides whether it is practical. MJX runs the physics on the GPU, which lets thousands of environments step in parallel next to the policy. Tracking velocity alone produces gaits that move but shuffle or waste torque, so each reward term penalizes one specific bad habit.\n\nI randomized the physics and pushed the robot because a policy trained on one set of parameters is brittle. I checked both policies in CPU MuJoCo because a policy can exploit quirks of one simulator. If it still works on a different implementation of the physics, it is less likely to be overfit.",
        result: "The humanoid tracks commands with under 0.15 m/s mean error and recovers from 95% of randomized lateral pushes. The hand achieves 12 consecutive in-hand cube reorientations per episode."
      },
      results: ["< 0.15 m/s mean tracking error", "Recovers from 95% of pushes", "12 consecutive cube reorientations"],
      skills: ["Python", "JAX", "MuJoCo MJX", "PPO", "Reward shaping"],
      sprite: "humanoid",
      photos: [],
      links: []
    },
    {
      id: "grasp-imitation",
      category: "Robot learning",
      zone: "Grasp Studio",
      title: "Language-Conditioned Visuomotor Imitation Learning for Grasping",
      date: "Nov 2026 – Present",
      summary: "One vision policy that performs three grasping tasks from a language instruction, learned from 600 human demonstrations.",
      story: {
        problem: "I wanted one policy that performs different grasping tasks depending on a language instruction, and that learns from human demonstrations instead of a hand-written reward.",
        action: "I built a multi-task vision policy with a ResNet-18 image encoder, conditioned on frozen CLIP text embeddings through FiLM. I trained it on 600 human teleoperation demonstrations across three tasks: lift, pick-and-place and nut-on-peg. I then added wrist-camera views, random-crop augmentation, and action chunking with temporal ensembling.",
        why: "For manipulation, showing the task is easier than specifying a reward for it, so I used imitation. Six hundred demonstrations cannot teach a model language, but CLIP's text encoder already has it. Freezing it stops a small dataset from damaging what it knows. FiLM lets the instruction scale and shift the visual features, so the same network looks for different things depending on the task.\n\nI added a wrist camera because the precise part of an insertion is hidden from an external view by the gripper. Random crops stop the policy memorizing pixel positions. Predicting one action at a time lets small errors compound, so I predict short chunks and average the overlapping predictions for smoother motion.",
        result: "One policy reached 85% average success over 150 rollouts on the three language-specified tasks. The wrist camera, augmentation and action chunking together improved precision nut-insertion success by 18 points."
      },
      results: ["85% average success over 150 rollouts", "+18 points on nut insertion", "600 demonstrations, 3 tasks"],
      skills: ["PyTorch", "CLIP", "robomimic", "FiLM", "Imitation learning"],
      sprite: "gripper",
      photos: [],
      links: []
    },

    /* ---------------- Software and AI tools ---------------- */
    {
      id: "rtl-assistant",
      category: "Software and AI tools",
      zone: "RTL Assistant",
      title: "Agentic RTL Design-Flow Assistant",
      date: "Nov 2026 – Present",
      summary: "A full-stack assistant whose agents run real lint, simulation and synthesis tools, so every proposed RTL fix is checked before a person sees it.",
      story: {
        problem: "RTL debugging is a loop: lint, simulate, read the error, fix, repeat. Most of that loop is mechanical. I wanted to see how much of it an AI assistant could take over without my having to trust an LLM's output blindly.",
        action: "I built a full-stack tool with a responsive React/TypeScript UI, a Node.js/Express REST API and a PostgreSQL database. A planner agent coordinates four tool-calling sub-agents that run Verilator lint, Icarus Verilog simulation, Yosys synthesis and Quartus Tcl scripts on Linux. I added RAG over 200+ pages of datasheets and design guides, with the embeddings stored in PostgreSQL through pgvector. Everything runs in Docker, and a GitHub Actions pipeline runs 60+ Jest and pytest tests.",
        why: "An LLM cannot know whether Verilog is correct, but a linter and a simulator can. With tool calling, every fix the model proposes is checked by a real tool before I see it. I split the work into a planner and sub-agents so each agent has one tool and one narrow job, which is easier to prompt and to test.\n\nI added retrieval because an answer about a specific part should come from its datasheet, with a citation, not from the model's memory. I kept embeddings in pgvector so I did not need a second database. I measured the tool with injected bugs and an eval set because \"it seems to work\" is not evidence. The CI pipeline is there because a prompt edit can silently change agent behaviour.",
        result: "Manual lint-simulate-debug iterations dropped by about 60% on 25 Verilog designs. The agents fixed 18 of 25 injected RTL bugs automatically, which is 72%. Cited-answer accuracy rose from 55% to 85% on a 40-question eval set."
      },
      results: ["~60% fewer manual debug iterations", "18 of 25 injected bugs fixed (72%)", "Cited answers 55% → 85% accurate"],
      skills: ["React/TypeScript", "Node.js/Express", "PostgreSQL + pgvector", "LLM tool calling", "Docker", "GitHub Actions"],
      sprite: "server",
      photos: [],
      links: []
    },
    {
      id: "pm-assistant",
      category: "Software and AI tools",
      zone: "Task Desk",
      title: "AI Project-Management Assistant",
      date: "Oct 2026",
      summary: "Turns meeting notes into tracked tasks with owners and due dates, then sends the reminders automatically.",
      story: {
        problem: "After a meeting, someone has to turn the notes into tasks with owners and due dates, and then chase them. By hand that took about 15 minutes per meeting, and follow-ups were easy to forget.",
        action: "I built a React and Node.js app that uses LLM tool calling to extract action items, owners and due dates from meeting notes into PostgreSQL. Scheduled Node.js jobs send Slack and email reminders and write weekly LLM status summaries.",
        why: "I used tool calling instead of free-text output because I need structured fields that go straight into a database. A function schema forces the model to return exactly a task, an owner and a date. I stored the tasks in a database so they can be tracked and queried afterwards, not just displayed once.\n\nExtraction solves only half the problem. The tasks that slip are the ones nobody is reminded about, so I added scheduled reminders and a weekly summary.",
        result: "Meeting notes become tracked tasks in under one minute, against about 15 minutes by hand, and follow-ups go out automatically."
      },
      results: ["Notes to tasks in < 1 minute (was ~15)", "Automatic follow-ups"],
      skills: ["React", "Node.js", "LLM APIs", "PostgreSQL"],
      sprite: "monitor",
      photos: [],
      links: []
    },
    {
      id: "travel-assistant",
      category: "Software and AI tools",
      zone: "Travel Desk",
      title: "REST API Travel Assistant",
      date: "Sep 2025",
      summary: "A team-built Python travel planner that pulls real-time flights, stays, attractions and restaurants from six REST APIs into one structure.",
      story: {
        problem: "Planning a trip means checking flights, accommodation, attractions and restaurants on separate sites. Our team wanted one tool that pulls real-time data from all of them and plans an itinerary around cost and personal preferences.",
        action: "In a multidisciplinary team, I led development of a Python travel assistant. I integrated six REST APIs for flights, accommodations, local attractions and restaurants. I wrote the methods that send the requests and parse the JSON responses, organizing flight information such as airline names, airport details and price into a structured dictionary. We worked in a GitHub repository and updated the tool based on user feedback.",
        why: "Every API returns JSON in its own shape. I parsed each response into a structured dictionary so the rest of the application does not care which provider the data came from. That gave teammates working on the interface and on data analysis a stable structure to build on while I changed the API code underneath. We used a shared repository so several people could work in parallel.",
        result: "The application served real-time flight, accommodation, attraction and restaurant data from six APIs, and feedback-driven updates made it more robust and easier to use."
      },
      results: ["6 REST APIs integrated", "Led development in a multidisciplinary team"],
      skills: ["Python", "REST APIs", "JSON", "GitHub"],
      sprite: "globe",
      photos: [],
      links: []
    },
    {
      id: "vbnet-production",
      category: "Software and AI tools",
      zone: "Production Line",
      title: "VB.NET Production-Control Application",
      summary: "Generates wire schedules and terminal lists from a bill of materials: proven first as Excel VBA, then rebuilt as object-oriented VB.NET on MySQL.",
      story: {
        problem: "Wire schedules and terminal lists for a panel are derived from the bill of materials, and typing them by hand is where a wrong terminal number gets in. I also wanted hands-on practice with the Visual Basic environment that sits behind manufacturing execution tools.",
        action: "I wrote Excel VBA macros that generate wire schedules and terminal lists from a bill of materials. Then I built a VB.NET production-control application with a MySQL backend, and upgraded the VBA prototype into object-oriented VB.NET.",
        why: "I started in VBA because it is the fastest way to prove the logic where the data already lives, in Excel. But macros inside a workbook are hard to maintain, and the data stays trapped in one file. Moving to VB.NET with classes gave the code structure, and MySQL gave it one shared source of truth.\n\nThe prototype-then-upgrade path was deliberate. Upgrading and maintaining an existing Visual Basic tool is the real work in production engineering, so I practised exactly that.",
        result: "A working VB.NET application with a MySQL backend that turns a bill of materials into wire schedules and terminal lists, replacing the macro prototype."
      },
      results: ["BOM → wire schedules and terminal lists", "VBA prototype upgraded to object-oriented VB.NET"],
      skills: ["VB.NET", "MySQL", "Excel VBA"],
      sprite: "factory",
      photos: [],
      links: []
    },

    /* ---------------- Power systems ---------------- */
    {
      id: "switchgear-13kv",
      category: "Power systems",
      zone: "Switchgear Yard",
      title: "13.8 kV Four-Feeder Switchgear: Single-Line Diagram and Overcurrent Coordination",
      summary: "The single-line diagram, overcurrent coordination, AC/DC schematics and wiring diagrams for a 13.8 kV, four-feeder switchgear lineup.",
      story: {
        problem: "A switchgear lineup has two jobs. It delivers power to its feeders, and when there is a fault it disconnects only the faulted feeder and nothing else. I wanted to work through both for a 13.8 kV lineup with four feeders.",
        action: "I designed the single-line diagram and the overcurrent coordination for the lineup. Then I drafted its AC and DC schematics and its wiring diagrams in AutoCAD.",
        why: "I started with the single-line diagram because every other drawing derives from it. It shows the source, the bus, the feeders and the protective devices on one page. I did the coordination next because protection is only selective if the device nearest the fault operates first and the upstream device waits. That comes from choosing settings so the time-current curves do not overlap.\n\nThe schematics and wiring diagrams came last. The single-line says what the protection should do, and the wiring diagram is what the shop actually builds from, so an error there travels all the way to the field.",
        result: "A complete drawing set for the lineup: single-line diagram, overcurrent coordination, AC/DC schematics and wiring diagrams. This is my newest area, and I know there is more to learn about protection and control to CSA and ANSI standards."
      },
      results: ["Complete drawing set", "Selective overcurrent coordination"],
      skills: ["AutoCAD", "Single-line diagrams", "Protection coordination"],
      sprite: "switchgear",
      demo: "feeders",
      photos: [],
      links: []
    }
  ]
};
