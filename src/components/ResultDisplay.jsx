import { useState, useEffect } from 'react';
import config from '../../config';
// import createGif from '../utils/createGif.js';

export function ResultDisplay({ score, totalQuestions, results, gameNumber, product, isPreviouslyCompleted }) {
    const [shareText, setShareText] = useState('Share Your Score');
    const [shareFile, setShareFile] = useState();
    const [scoreImage, setScoreImage] = useState();
    const [stats, setStats] = useState({
        played: 0,
        avgScore: 0,
        currentStreak: 0,
        maxStreak: 0
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Calculate stats from localStorage
        const calculateStats = () => {
            let played = 0;
            let totalScore = 0;
            let currentStreak = 0;
            let maxStreak = 0;
            let streakCount = 0;

            // Get all localStorage keys and sort them by date
            const dateKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    dateKeys.push(key);
                }
            }
            dateKeys.sort(); // Sort in ascending order

            // Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];
            
            // Calculate stats
            for (let i = 0; i < dateKeys.length; i++) {
                const key = dateKeys[i];
                const gameData = JSON.parse(localStorage.getItem(key));
                played++;
                totalScore += (gameData.score / gameData.totalQuestions) * 100;

                // For streak calculation
                if (i === 0) {
                    streakCount = 1;
                } else if (isConsecutiveDate(dateKeys[i-1], key)) {
                    streakCount++;
                } else {
                    streakCount = 1;
                }

                // Update max streak
                maxStreak = Math.max(maxStreak, streakCount);
                
                // If this is today's date or the most recent date, update current streak
                if (key === today || i === dateKeys.length - 1) {
                    currentStreak = streakCount;
                }
            }

            // Helper function to check if two dates are consecutive
            function isConsecutiveDate(date1, date2) {
                const d1 = new Date(date1);
                const d2 = new Date(date2);
                const diffTime = Math.abs(d1 - d2);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays === 1;
            }

            const stats = {
                played,
                avgScore: played ? Math.round(totalScore / played) / 10 : 0,
                currentStreak,
                maxStreak
            };
            setStats(stats);
            if (!isPreviouslyCompleted) {
                sa_event('completed_game', stats);
            }
        };

        calculateStats();
        setScoreImage(getScoreImage());
    }, []);

    // useEffect(() => {
    //     async function doShare() {
    //         if (shareFile) {
    //             // Ensure the file is ready before sharing
    //             if (navigator.canShare && navigator.canShare({ files: [shareFile] }) && navigator.share) {
    //                 await navigator.share({
    //                     // files: [shareFile],
    //                     url: getScoreImage(),
    //                     text: generateShareText(),
    //                 });
    //             } else {
    //                 // await navigator.clipboard.writeText(text);
    //                 // setShareText('Copied!');
    //                 // setTimeout(() => setShareText('Share Your Score'), 2000);
  
    //                 // Fallback: Let the user download the GIF and share manually
    //                 const url = URL.createObjectURL(shareFile);
    //                 const a = document.createElement("a");
    //                 a.href = url;
    //                 a.download = shareFile.name;
    //                 document.body.appendChild(a);
    //                 a.click();
    //                 document.body.removeChild(a);
    //                 URL.revokeObjectURL(url);                    
    //             }
    //         }
    //     }
    //     doShare();
    // }, [shareFile]);

    // const generateGif = async () => {
    //     setIsLoading(true);
    //     let file = null; // Initialize file variable
    //     try {
    //         const image = await createGif(score, generateShareText());
    //         setImage(image);
    //         const blob = await fetch(image).then(res => res.blob());
    //         file = new File([blob], `dailysein${gameNumber}.gif`, { type: "image/gif" });
    //         setShareFile(file);
    //         console.log(shareFile); // Log the file instead of shareFile to see the correct value
    //     } catch (error) {
    //         console.error("Error creating GIF:", error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const generateShareText = () => {
        const boxes = results.map(result => result ? '🟩' : '⬛').join('');
        return `${config.shareText} #${gameNumber}\n\n${score}/${totalQuestions}\n${boxes}`;
        // return `DailySein.com #${gameNumber} ${score}/${totalQuestions}  ${boxes}`;
    };

    const handleShare = async () => {
        try {
            const text = generateShareText();

            if (navigator.share) {
                await navigator.share({
                    text: text,
                });
            } else {
                await navigator.clipboard.writeText(text);
                setShareText('Copied!');
                setTimeout(() => setShareText('Share Your Score'), 2000);
            }
        } catch (error) {
            reportError(error);
            setShareText('Share Your Score');
        }
    };

    // const handleShare = async () => {
    //     try {
    //         const text = "Check out my score on DailySein!"; // Simple test text
    //         await generateGif();
    //     } catch (error) {
    //         console.error("Error during sharing:", error);
    //         reportError(error);
    //         setShareText('Share Your Score');
    //     }
    // };

    const getScoreImage = () => {
        // const gifsForScore = gifs["9"]; // for testing
        const gifsForScore = config.gifs[score];
        const randomIndex = Math.floor(Math.random() * gifsForScore.length);
        const gifDetails = gifsForScore[randomIndex];                
        return `${import.meta.env.BASE_URL}${config.baseDir}/gifs/${gifDetails.name}.gif`;
    };

    return (
        <div data-name="result-display" className="text-center px-8">
            <div>
                <div className="stats-container grid grid-cols-4 gap-4 mb-8 bg-gray-300 p-4 rounded-lg">
                    <div className="stat-item">
                        <div className="text-2xl font-bold">{stats.played}</div>
                        <div className="text-sm text-gray-600">Games Played</div>
                    </div>
                    <div className="stat-item">
                        <div className="text-2xl font-bold">{stats.avgScore}</div>
                        <div className="text-sm text-gray-600">Avg Score</div>
                    </div>
                    <div className="stat-item">
                        <div className="text-2xl font-bold">{stats.currentStreak}</div>
                        <div className="text-sm text-gray-600">Current Streak</div>
                    </div>
                    <div className="stat-item">
                        <div className="text-2xl font-bold">{stats.maxStreak}</div>
                        <div className="text-sm text-gray-600">Max Streak</div>
                    </div>
                </div>                
                <div 
                    data-name="score-gif" 
                    className="max-w-sm mx-auto mb-4 relative"
                >
                    <img
                        src={scoreImage}
                        alt="Score reaction"
                        className="w-full rounded-lg shadow-lg min-h-[150px] bg-gray-200"
                    />
                    <div className="absolute bottom-0 left-0 right-0">
                        <h2 data-name="final-score" className="text-xl font-bold text-white text-center p-2" style={{ textShadow: '2px 2px 0px black' }}>
                            Your Score: {score}/{totalQuestions}
                        </h2>
                        <div data-name="result-boxes" className="flex justify-center flex-wrap gap-1 mb-2">
                            {results.map((result, index) => (
                                <div
                                    key={index}
                                    data-name="result-box"
                                    className={`result-box rounded-md ${
                                        result ? 'bg-green-500' : 'bg-gray-700'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <button
                    data-name="share-button"
                    onClick={handleShare}
                    className={`bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors mb-16 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Generating shareable GIF' : shareText}
                </button>
                <>
                    {product !== undefined && (
                        <div className="daily-find-container mb-16 bg-gray-200 p-4 rounded-lg">
                            <h3 className="text-2xl font-bold mb-4">The Daily Find</h3>
                            <a 
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img 
                                    src={`${import.meta.env.BASE_URL}${config.baseDir}/product-images/${product.image}`}
                                    alt="Product"
                                    className="product-image mx-auto mb-4 rounded-lg shadow-lg"
                                />
                            </a>
                            <a 
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Get it
                            </a>
                        </div>
                    )}
                    <img 
                        src={`${import.meta.env.BASE_URL}${config.baseDir}/images/${config.comeBackImage.filename}`}
                        alt={config.comeBackImage.altText}
                        className="mx-auto mb-4 rounded-lg shadow-lg"
                    />                        
                    <p className="text-gray-600 mb-8">Come back tomorrow for a new set of questions!</p>
                    <div className="mb-8">
                        <button
                            onClick={() => document.getElementById('install-dialog').showModal()}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Add to Home Screen
                        </button>
                        
                        <dialog 
                            id="install-dialog" 
                            className="p-6 rounded-lg shadow-xl backdrop:bg-black backdrop:bg-opacity-50"
                        >
                            <p className="mb-4">Tap the <b>Share</b> button in your browser, then click <b>Add to Home Screen</b></p>
                            <button 
                                onClick={() => document.getElementById('install-dialog').close()}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </dialog>
                    </div>
                </>
            </div>
        </div>
    );
}
