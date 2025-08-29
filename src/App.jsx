import React, { useState, useEffect, useRef } from 'react';

// Main App component for the Individual Skill Tournament
const App = () => {
    // State to manage the list of players for the tournament
    const [players, setPlayers] = useState(() => {
        try {
            const storedPlayers = localStorage.getItem('tournamentPlayers');
            return storedPlayers ? JSON.parse(storedPlayers) : [];
        } catch (error) {
            console.error("Error loading tournament players from localStorage:", error);
            return [];
        }
    });

    // State to manage scores for each skill challenge for each player
    // Now stores { sum: number, count: number } for each skill
    const [tournamentScores, setTournamentScores] = useState(() => {
        try {
            const storedScores = localStorage.getItem('tournamentScores');
            // Check if storedScores is in the new {sum, count} format
            // If not, it means it's old data (just numbers), so re-initialize
            // This is a basic migration/compatibility check
            if (storedScores) {
                const parsedScores = JSON.parse(storedScores);
                const firstChallengeKey = Object.keys(parsedScores)[0];
                if (firstChallengeKey && parsedScores[firstChallengeKey]) {
                    const firstPlayerId = Object.keys(parsedScores[firstChallengeKey])[0];
                    if (firstPlayerId && typeof parsedScores[firstChallengeKey][firstPlayerId] === 'number') {
                        console.warn("Detected old score format in localStorage. Re-initializing tournament scores.");
                        return {}; // Clear old format
                    }
                }
                return parsedScores;
            }
            return {};
        } catch (error) {
            console.error("Error loading tournament scores from localStorage:", error);
            return {};
        }
    });

    // State for the new player name input
    const [newPlayerName, setNewPlayerName] = useState('');

    // State for the currently selected skill challenge for scoring/ranking
    const [selectedChallenge, setSelectedChallenge] = useState(null);

    // Ref for the file input element to programmatically trigger it
    const fileInputRef = useRef(null);

    // State to show/hide the position suggestions
    const [showSuggestions, setShowSuggestions] = useState(false);
    // New state to hold the suggested roles for all players
    const [suggestedPlayerRoles, setSuggestedPlayerRoles] = useState([]);

    // State for custom modal
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalAction, setModalAction] = useState(null); // Function to execute on confirm
    const [modalTitle, setModalTitle] = useState('Mensaje');
    const [showCancelButton, setShowCancelButton] = useState(false);


    // Define all available skill challenges with their keys and display names
    const allChallenges = [
        { key: 'recepcion', name: 'Recepción' },
        { key: 'ataque', name: 'Ataque' },
        { key: 'defensa', name: 'Defensa' },
        { key: 'saque', name: 'Saque' },
        { key: 'bloqueo', name: 'Bloqueo' },
        { key: 'colocacion', name: 'Colocación' },
    ];

    // Define scoring options for each challenge
    const scoringOptions = {
        recepcion: [
            { score: 3, description: 'Balón en zona' },
            { score: 2, description: 'Balón cerca de zona' },
            { score: 1, description: 'Balón controlado' },
            { score: 0, description: 'Recepción fallida' },
        ],
        ataque: [
            { score: 5, description: 'Directo al objetivo' },
            { score: 3, description: 'En zona objetivo' },
            { score: 1, description: 'Dentro de cancha' },
            { score: 0, description: 'Fuera/Red/Bloqueo' },
        ],
        defensa: [
            { score: 4, description: 'Recuperación controlada' },
            { score: 2, description: 'Recuperación sin control' },
            { score: 1, description: 'Toca, no controla' },
            { score: 0, description: 'Fallo completo' },
        ],
        saque: [
            { score: 5, description: 'Ace en zona' },
            { score: 3, description: 'En zona, recibido' },
            { score: 1, description: 'En cancha, fuera zona' },
            { score: 0, description: 'Falta de saque' },
        ],
        bloqueo: [
            { score: 5, description: 'Punto de bloqueo' },
            { score: 3, description: 'Toque controlado' },
            { score: 1, description: 'Toca, no controla' },
            { score: 0, description: 'Fallo de bloqueo' },
        ],
        colocacion: [
            { score: 5, description: 'Directo al aro' },
            { score: 3, description: 'Cerca del aro' },
            { score: 1, description: 'Controlada, fuera zona' },
            { score: 0, description: 'Colocación fallida' },
        ],
    };

    // Custom Modal display function
    const showCustomModal = (message, title = 'Mensaje', action = null, showCancel = false) => {
        setModalMessage(message);
        setModalTitle(title);
        setModalAction(() => action); // Store the action function
        setShowCancelButton(showCancel);
        setShowModal(true);
    };

    // Close Modal
    const closeModal = () => {
        setShowModal(false);
        setModalMessage('');
        setModalTitle('Mensaje');
        setModalAction(null);
        setShowCancelButton(false);
    };

    // Handle Modal Confirmation
    const handleModalConfirm = () => {
        if (modalAction) {
            modalAction(); // Execute the stored action
        }
        closeModal();
    };


    // Persist players and scores to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('tournamentPlayers', JSON.stringify(players));
        } catch (error) {
            console.error("Error saving tournament players to localStorage:", error);
            showCustomModal("Error al guardar los jugadores en el almacenamiento local.", "Error de Guardado");
        }
    }, [players]);

    useEffect(() => {
        try {
            localStorage.setItem('tournamentScores', JSON.stringify(tournamentScores));
        } catch (error) {
            console.error("Error saving tournament scores to localStorage:", error);
            showCustomModal("Error al guardar los puntajes en el almacenamiento local.", "Error de Guardado");
        }
    }, [tournamentScores]);


    // Add a new player to the tournament list
    const addPlayer = () => {
        if (newPlayerName.trim() === '') {
            showCustomModal('Por favor, ingresa el nombre del jugador.', 'Nombre Requerido');
            return;
        }

        const newPlayer = {
            id: Date.now(),
            name: newPlayerName,
        };

        setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
        setNewPlayerName(''); // Reset input

        // Initialize scores for the new player for all challenges
        setTournamentScores(prevScores => {
            const updatedScores = { ...prevScores };
            allChallenges.forEach(challenge => {
                if (!updatedScores[challenge.key]) {
                    updatedScores[challenge.key] = {};
                }
                // Initialize with sum: 0, count: 0 for the new format
                updatedScores[challenge.key][newPlayer.id] = { sum: 0, count: 0 };
            });
            return updatedScores;
        });
        showCustomModal(`${newPlayer.name} ha sido añadido al torneo.`, 'Jugador Añadido');
    };

    // Remove a player from the tournament
    const removePlayer = (playerIdToRemove) => {
        // Confirmation before removal
        const playerToRemove = players.find(player => player.id === playerIdToRemove);
        showCustomModal(
            `¿Estás seguro de que quieres eliminar a ${playerToRemove.name}? Esta acción es irreversible.`,
            'Confirmar Eliminación',
            () => {
                setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== playerIdToRemove));

                // Also remove player's scores from tournamentScores
                setTournamentScores(prevScores => {
                    const updatedScores = { ...prevScores };
                    Object.keys(updatedScores).forEach(challengeKey => {
                        if (updatedScores[challengeKey]) {
                            delete updatedScores[challengeKey][playerIdToRemove];
                        }
                    });
                    return updatedScores;
                });
                showCustomModal(`${playerToRemove.name} ha sido eliminado.`, 'Jugador Eliminado');
            },
            true // Show cancel button
        );
    };

    // Handle score change for a specific player in the selected challenge
    // Now ADDING the scoreValue to the current score and incrementing count
    const handleScoreUpdate = (playerId, scoreValue) => {
        if (selectedChallenge) {
            setTournamentScores(prevScores => {
                const currentScoreData = prevScores[selectedChallenge]?.[playerId] || { sum: 0, count: 0 };
                return {
                    ...prevScores,
                    [selectedChallenge]: {
                        ...prevScores[selectedChallenge],
                        [playerId]: {
                            sum: currentScoreData.sum + parseInt(scoreValue),
                            count: currentScoreData.count + 1
                        },
                    },
                };
            });
        }
    };

    // Function to get the overall ranking including all skill scores and total average score
    const getOverallRanking = () => {
        // If no players, return empty array
        if (players.length === 0) {
            return { rankedPlayers: [], globalMinAverages: {}, globalMaxAverages: {} };
        }

        const allAveragesForChallenges = {}; // To store all average scores for each challenge across all players
        allChallenges.forEach(challenge => {
            allAveragesForChallenges[challenge.key] = [];
        });

        const rankingData = players.map(player => {
            let totalRawPoints = 0;
            let totalEvaluationsCount = 0;
            const skillAverages = {};

            allChallenges.forEach(challenge => {
                const skillData = tournamentScores[challenge.key]?.[player.id] || { sum: 0, count: 0 };
                const average = skillData.count > 0 ? (skillData.sum / skillData.count) : 0;

                skillAverages[challenge.key] = average;
                totalRawPoints += skillData.sum;
                totalEvaluationsCount += skillData.count;
                allAveragesForChallenges[challenge.key].push(average); // Collect averages for global min/max
            });

            // Calculate overall average for the player
            const overallAverage = totalEvaluationsCount > 0 ? (totalRawPoints / totalEvaluationsCount) : 0;

            // Calculate min and max average scores for this specific player across their skills
            const averagesArray = Object.values(skillAverages);
            const minAverage = averagesArray.length > 0 ? Math.min(...averagesArray) : 0;
            const maxAverage = averagesArray.length > 0 ? Math.max(...averagesArray) : 0;

            return {
                ...player,
                skillAverages, // Object with average scores for each individual skill
                overallAverage,   // Overall average of all skill scores for this player
                minAverage,     // Min average score across all challenges for this player
                maxAverage,     // Max average score across all challenges for this player
            };
        });

        const globalMinAverages = {};
        const globalMaxAverages = {};
        allChallenges.forEach(challenge => {
            const averages = allAveragesForChallenges[challenge.key];
            if (averages.length > 0) {
                globalMinAverages[challenge.key] = Math.min(...averages);
                globalMaxAverages[challenge.key] = Math.max(...averages);
            } else {
                globalMinAverages[challenge.key] = 0; // Default if no averages
                globalMaxAverages[challenge.key] = 0; // Default if no averages
            }
        });

        // Sort by overallAverage in descending order
        return {
            rankedPlayers: rankingData.sort((a, b) => b.overallAverage - a.overallAverage),
            globalMinAverages,
            globalMaxAverages
        };
    };

    const { rankedPlayers, globalMinAverages, globalMaxAverages } = getOverallRanking();


    // Function to download tournament data as a JSON file
    const downloadTournamentData = () => {
        const dataToDownload = {
            players: players,
            tournamentScores: tournamentScores
        };
        const jsonData = JSON.stringify(dataToDownload, null, 2); // Pretty print JSON
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'torneo_habilidades_voleibol.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showCustomModal('Los datos del torneo han sido descargados.', 'Descarga Completa');
    };

    // Function to handle file upload for loading tournament data
    const handleLoadData = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                // Basic check for new format: check if first skill score for first player is an object
                const firstChallengeKey = Object.keys(loadedData.tournamentScores)[0];
                const firstPlayerId = firstChallengeKey ? Object.keys(loadedData.tournamentScores[firstChallengeKey])[0] : null;

                if (loadedData.players && loadedData.tournamentScores &&
                    (!firstPlayerId || (firstPlayerId && typeof loadedData.tournamentScores[firstChallengeKey][firstPlayerId] === 'object' && 'sum' in loadedData.tournamentScores[firstChallengeKey][firstPlayerId]))) {
                    setPlayers(loadedData.players);
                    setTournamentScores(loadedData.tournamentScores);
                    showCustomModal('Datos del torneo cargados exitosamente.', 'Carga Exitosa');
                } else {
                    showCustomModal('El archivo JSON no tiene el formato esperado (se espera {sum, count} para puntajes de habilidad) o es un formato antiguo.', 'Error de Formato');
                }
            } catch (error) {
                console.error("Error al parsear el archivo JSON:", error);
                showCustomModal('Error al leer el archivo JSON. Asegúrate de que sea un archivo válido.', 'Error de Lectura');
            }
        };
        reader.readAsText(file);
        // Clear the input value so the same file can be loaded again if needed
        event.target.value = null;
    };

    // Trigger file input click
    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    // Define role map for display purposes
    const roleMap = {
        'setter': 'Pasador',
        'middleBlocker': 'Bloqueador Central',
        'outsideHitter': 'Atacante de Punta',
        'opposite': 'Opuesto',
        'libero': 'Líbero',
        'Jugador General': 'Jugador General'
    };


    // Function to suggest roles for players based on their average skill scores
    const suggestTeamComposition = () => {
        if (players.length === 0) {
            showCustomModal('Añade jugadores para sugerir roles.', 'Sin Jugadores');
            return;
        }

        const playersWithRoleScores = players.map(player => {
            const playerRanking = getOverallRanking().rankedPlayers.find(p => p.id === player.id);
            const s = playerRanking?.skillAverages || {};

            // Ensure skills exist, default to 0 if not evaluated
            const recepcion = s.recepcion || 0;
            const ataque = s.ataque || 0;
            const defensa = s.defensa || 0;
            const saque = s.saque || 0;
            const bloqueo = s.bloqueo || 0;
            const colocacion = s.colocacion || 0;

            // Calculate raw scores for various roles based on weighted skill averages
            const rawRoleScores = {
                setter: (colocacion * 5) + (recepcion * 3) + (defensa * 2),
                middleBlocker: (bloqueo * 5) + (ataque * 3),
                outsideHitter: (ataque * 4) + (recepcion * 3) + (defensa * 2),
                opposite: (ataque * 4) + (bloqueo * 3) + (saque * 2),
                libero: (recepcion * 5) + (defensa * 5)
            };

            return {
                ...player,
                overallAverage: playerRanking.overallAverage,
                rawRoleScores: rawRoleScores,
                rankingPosition: rankedPlayers.findIndex(p => p.id === player.id) + 1 // Get ranking position
            };
        });

        const finalPlayerRoles = []; // To store the { player, role } objects for the output
        const roleCounts = { 'Pasador': 0, 'Opuesto': 0, 'Líbero': 0 };
        const assignedIds = new Set(); // To track players already assigned a role

        // Deep copy for mutable operations (so we can remove players as they are assigned)
        let mutablePlayers = JSON.parse(JSON.stringify(playersWithRoleScores));

        // Helper to find, assign, and track a player for a limited role
        const findAndAssignLimitedRole = (roleInternalKey, roleDisplayName, limit) => {
            if (roleCounts[roleDisplayName] < limit) {
                // Sort by the specific role score, descending
                mutablePlayers.sort((a, b) => b.rawRoleScores[roleInternalKey] - a.rawRoleScores[roleInternalKey]);

                // Find the best available player for this role
                let bestCandidate = null;
                for (let i = 0; i < mutablePlayers.length; i++) {
                    if (!assignedIds.has(mutablePlayers[i].id)) {
                        bestCandidate = mutablePlayers[i];
                        break;
                    }
                }

                if (bestCandidate) {
                    finalPlayerRoles.push({ player: bestCandidate, role: roleDisplayName, rankingPosition: bestCandidate.rankingPosition });
                    assignedIds.add(bestCandidate.id);
                    roleCounts[roleDisplayName]++;
                }
            }
        };

        // 1. Assign Líbero (limit 1)
        findAndAssignLimitedRole('libero', 'Líbero', 1);

        // 2. Assign Pasadores (limit 2)
        findAndAssignLimitedRole('setter', 'Pasador', 2); // First Pasador
        findAndAssignLimitedRole('setter', 'Pasador', 2); // Second Pasador

        // 3. Assign Opuestos (limit 2)
        findAndAssignLimitedRole('opposite', 'Opuesto', 2); // First Opuesto
        findAndAssignLimitedRole('opposite', 'Opuesto', 2); // Second Opuesto

        // 4. Assign Remaining Players (Atacante de Punta / Bloqueador Central)
        // For the remaining players, assign them based on their strongest score between outsideHitter and middleBlocker
        playersWithRoleScores.forEach(player => {
            if (!assignedIds.has(player.id)) { // Only process unassigned players
                const outsideHitterScore = player.rawRoleScores.outsideHitter;
                const middleBlockerScore = player.rawRoleScores.middleBlocker;

                if (outsideHitterScore >= middleBlockerScore) {
                    finalPlayerRoles.push({ player: player, role: 'Atacante de Punta', rankingPosition: player.rankingPosition });
                } else {
                    finalPlayerRoles.push({ player: player, role: 'Bloqueador Central', rankingPosition: player.rankingPosition });
                }
                assignedIds.add(player.id); // Mark as assigned
            }
            // If the player somehow wasn't assigned a specific role (e.g., if roles are limited and player count is high)
            if (!assignedIds.has(player.id)) {
                finalPlayerRoles.push({ player: player, role: 'Jugador General', rankingPosition: player.rankingPosition });
                assignedIds.add(player.id);
            }
        });

        // Sort the final list by ranking position
        finalPlayerRoles.sort((a, b) => a.rankingPosition - b.rankingPosition);

        setSuggestedPlayerRoles(finalPlayerRoles); // Update the new state
        setShowSuggestions(true);
        showCustomModal('Roles de jugadores sugeridos actualizados.', 'Sugerencia de Roles');
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 p-4 font-inter text-gray-800 flex flex-col items-center">
            {/* Tailwind CSS CDN script */}
            <script src="https://cdn.tailwindcss.com"></script>
            {/* Google Font - Inter */}
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

            {/* Header */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-purple-800 mb-8 mt-4 text-center">
                Torneo Individual de Habilidades de Voleibol
            </h1>
            <p className="text-lg text-center mb-8 max-w-2xl">
                Organiza y registra los puntajes de los desafíos individuales de cada habilidad para tus jugadores.
            </p>

            <div className="flex flex-col lg:flex-row w-full max-w-7xl gap-6">
                {/* Left Panel: Player Management */}
                <div className="bg-white p-8 rounded-xl shadow-lg w-full lg:w-1/3 mb-6 lg:mb-0 border border-purple-200 flex flex-col">
                    <h2 className="text-2xl font-bold text-indigo-700 mb-6">Gestión de Jugadores</h2>

                    {/* Add New Player Form */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-xl font-semibold text-purple-700 mb-4">Añadir Nuevo Jugador</h3>
                        <label htmlFor="newPlayerName" className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Jugador:
                        </label>
                        <input
                            type="text"
                            id="newPlayerName"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                            placeholder="Ej. Juan Pérez"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') addPlayer();
                            }}
                        />
                        <button
                            onClick={addPlayer}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                            Añadir Jugador al Torneo
                        </button>
                    </div>

                    {/* Download and Load Buttons */}
                    <div className="mt-6 space-y-3">
                        <button
                            onClick={downloadTournamentData}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Descargar Datos del Torneo
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleLoadData}
                            accept=".json"
                            className="hidden" // Hide the actual file input
                        />
                        <button
                            onClick={triggerFileInput}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            Cargar Datos del Torneo
                        </button>
                    </div>

                    {/* Player List */}
                    <h3 className="text-xl font-bold text-indigo-700 mb-4 mt-auto pt-6 border-t border-gray-200">Jugadores en el Torneo ({players.length})</h3>
                    {players.length === 0 ? (
                        <p className="text-gray-600 text-center py-4">
                            No hay jugadores en la lista. Carga un archivo o añade nuevos jugadores.
                        </p>
                    ) : (
                        <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {players.map(player => (
                                <li key={player.id} className="bg-purple-50 p-3 rounded-lg shadow-sm flex items-center justify-between">
                                    <span className="text-base font-medium text-purple-800 flex-grow mr-2">{player.name}</span>
                                    <button
                                        onClick={() => removePlayer(player.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-md shadow transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                                    >
                                        Eliminar
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Middle Panel: Challenge Selection & Score Input */}
                <div className="bg-white p-8 rounded-xl shadow-lg w-full lg:w-1/3 mb-6 lg:mb-0 border border-purple-200 flex flex-col">
                    <h2 className="text-2xl font-bold text-indigo-700 mb-6">Seleccionar Desafío de Habilidad</h2>

                    {/* Challenge Selection Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6 max-h-64 overflow-y-auto pr-2">
                        {allChallenges.map(challenge => (
                            <button
                                key={challenge.key}
                                onClick={() => setSelectedChallenge(challenge.key)}
                                className={`py-3 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
                                    ${selectedChallenge === challenge.key ? 'bg-purple-700 text-white ring-purple-500' : 'bg-purple-500 hover:bg-purple-600 text-white ring-purple-500'}`}
                            >
                                {allChallenges.find(c => c.key === challenge.key)?.name}
                            </button>
                        ))}
                    </div>

                    <hr className="my-6 border-t border-gray-200" />

                    <h2 className="text-2xl font-bold text-indigo-700 mb-6">
                        {selectedChallenge ? `Puntuar: ${allChallenges.find(c => c.key === selectedChallenge)?.name}` : 'Puntuar Habilidad'}
                    </h2>

                    {selectedChallenge && players.length > 0 ? (
                        <ul className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                            {/* Sort players alphabetically for this list */}
                            {
                                [...players].sort((a, b) => a.name.localeCompare(b.name)).map(player => (
                                    <li key={player.id} className="bg-purple-50 p-4 rounded-lg shadow-sm">
                                        <h3 className="text-xl font-semibold text-purple-800 mb-2">{player.name}</h3>
                                        <div className="mb-2">
                                            <span className="block text-sm font-medium text-gray-700">Puntaje Actual: </span>
                                            <span className="font-semibold text-purple-600 text-xl">
                                                {tournamentScores[selectedChallenge]?.[player.id]?.sum !== undefined ? tournamentScores[selectedChallenge][player.id].sum : 0}
                                            </span>
                                            <span className="block text-xs text-gray-500">
                                                ({tournamentScores[selectedChallenge]?.[player.id]?.count || 0} evaluaciones)
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {scoringOptions[selectedChallenge].map(option => (
                                                <button
                                                    key={option.score}
                                                    onClick={() => handleScoreUpdate(player.id, option.score)}
                                                    className={`py-2 px-3 rounded-md text-sm font-medium transition-all duration-200
                                                        bg-blue-100 text-blue-800 hover:bg-blue-200`}
                                                >
                                                    {option.description} (+{option.score} pts)
                                                </button>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600 text-center py-20">
                            Selecciona un desafío de habilidad y añade jugadores para empezar a puntuar.
                        </p>
                    )}
                </div>

                {/* Right Panel: Tournament Ranking */}
                <div className="bg-white p-8 rounded-xl shadow-lg w-full lg:w-1/3 mb-6 lg:mb-0 border border-purple-200 flex flex-col">
                    <h2 className="text-2xl font-bold text-indigo-700 mb-6">Ranking General del Torneo</h2>

                    <button
                        onClick={suggestTeamComposition}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Sugerir Roles de Jugadores
                    </button>

                    {showSuggestions && suggestedPlayerRoles.length > 0 ? (
                        <div className="mt-2 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-md">
                            <h3 className="text-xl font-semibold text-blue-800 mb-3">Roles Sugeridos</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
                                {suggestedPlayerRoles.map(({ player, role, rankingPosition }) => (
                                    <li key={player.id} className="font-bold">
                                        <span className="text-blue-700">#{rankingPosition} {player.name}</span>
                                        <span className="font-normal text-gray-600">: {role}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : showSuggestions ? (
                        <p className="text-gray-600 italic">No hay jugadores disponibles para sugerir roles.</p>
                    ) : null}


                    {rankedPlayers.length === 0 ? (
                        <p className="text-gray-600 text-center py-4">
                            Añade jugadores y puntúalos para ver el ranking general.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            #
                                        </th>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Jugador
                                        </th>
                                        {allChallenges.map(challenge => (
                                            <th key={challenge.key} scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {challenge.name} (Avg)
                                            </th>
                                        ))}
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-purple-800">
                                            Total (Avg)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {rankedPlayers.map((player, index) => (
                                        <tr key={player.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {index + 1}
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {player.name}
                                            </td>
                                            {allChallenges.map(challenge => {
                                                const averageScore = player.skillAverages[challenge.key];
                                                let cellClasses = "px-3 py-4 whitespace-nowrap text-sm ";

                                                // Global highlights (background colors)
                                                if (globalMaxAverages[challenge.key] !== globalMinAverages[challenge.key]) { // Only highlight if there's variation
                                                    if (averageScore === globalMinAverages[challenge.key]) {
                                                        cellClasses += "bg-yellow-100 "; // Light yellow for global min
                                                    } else if (averageScore === globalMaxAverages[challenge.key]) {
                                                        cellClasses += "bg-blue-100 ";  // Light blue for global max
                                                    }
                                                }

                                                // Individual player highlights (text colors)
                                                if (player.minAverage !== player.maxAverage) {
                                                    if (averageScore === player.maxAverage) {
                                                        cellClasses += "text-green-600 font-bold";
                                                    } else if (averageScore === player.minAverage) {
                                                        cellClasses += "text-red-600 font-bold";
                                                    } else {
                                                        cellClasses += "text-gray-700";
                                                    }
                                                } else { // All averages are identical for this player
                                                    cellClasses += "text-gray-700";
                                                }

                                                return (
                                                    <td key={challenge.key} className={cellClasses}>
                                                        {averageScore.toFixed(2)}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-purple-700 font-bold">
                                                {player.overallAverage.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Info */}
            <p className="text-sm text-gray-600 mt-8 mb-4 text-center max-w-prose">
                Esta herramienta te ayudará a organizar y dar seguimiento a tu torneo individual de habilidades. ¡A divertirse y a mejorar!
            </p>

            {/* Custom Modal Component */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{modalTitle}</h3>
                        <p className="text-gray-700 mb-6">{modalMessage}</p>
                        <div className="flex justify-end space-x-3">
                            {showCancelButton && (
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                onClick={handleModalConfirm}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
