const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerDBObjectTOResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDBObjectTOResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//1 Get All Players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *FROM player_details;
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDBObjectTOResponseObject(eachPlayer)
    )
  );
});

//2 Get player details on Player_id API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details WHERE player_id = ${playerId};
    `;
  const player = await db.gt(getPlayerQuery);
  response.send(convertPlayerDBObjectTOResponseObject(player));
});

//3 Update Player Details API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details SET player_name = '${playerName}'
    WHERE player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// 4 GET match details on MAtch_id API
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT * FROM match_details WHERE match_id =${matchId};
    `;
  const matchDetails = await db.get(matchDetailsQuery);
  response.send(convertMatchDetailsDBObjectTOResponseObject(matchDetails));
});

//5 GET matches list on Player_id API
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT * FROM player_match_score
    NATURAL JOIN match_details
    WHERE player_id =${playerId};
    `;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(
    playermatches.map((eachMatch) =>
      convertMatchDetailsDBObjectTOResponseObject(eachMatch)
    )
  );
});

//6 GET matchId players API
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT * FROM player_match_score
       NATURAL JOIN player_details
    WHERE match_id = ${matchId};
    `;

  const playersArray = await db.get(getPlayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertPlayerDBObjectTOResponseObject(eachMatch)
    )
  );
});

//7 Get PlayerScores APi
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchplayersQuery2 = `
    SELECT 
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score NATURAL JOIN player_details
    WHERE player_id = ${playerId};
    `;
  const playersMatchDetails = await db.get(getMatchplayersQuery2);
  response.send(playersMatchDetails);
});

module.exports = app;
