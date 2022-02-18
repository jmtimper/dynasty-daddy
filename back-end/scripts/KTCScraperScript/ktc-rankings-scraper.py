from bs4 import BeautifulSoup
import os
import requests
import psycopg2
from sleeper_wrapper import Players


# cleans player ids in order to map ktc value to sleeper data
def cleanPlayerIdString(playerId):
    return playerId.lower().replace("jr.", "").replace("sr.", "").replace("iii", "").replace(" ", "").replace(".",
                                                                                                              "").replace(
        "-", "").replace("'", "")


# API calls to sleeper
players = Players()
sleeperData = players.get_all_players()


# creates a dict of sleeper ids mapped to name ids
def getSleeperData():
    temp = {}
    for playerId, value in sleeperData.items():
        sleepervalue = cleanPlayerIdString(str(value['first_name'] + value['last_name'] + str(value['position'])))
        temp[sleepervalue] = playerId
        # handle edge cases
        # P.J. Walker
        if value['first_name'] == 'Phillip':
            sleepervalue = cleanPlayerIdString(str('pj' + value['last_name'] + str(value['position'])).lower())
            temp[sleepervalue] = playerId
        # Chris Herdon
        if value['first_name'] == 'Christopher':
            sleepervalue = cleanPlayerIdString(str('chris' + value['last_name'] + str(value['position'])).lower())
            temp[sleepervalue] = playerId
        # Jeffery Wilson
        if value['first_name'] == 'Jeff':
            sleepervalue = cleanPlayerIdString(str('jeffery' + value['last_name'] + str(value['position'])).lower())
            temp[sleepervalue] = playerId
    return temp;


# Player class that is inserted into table
class Player:
    def __init__(self, id, name, first_name, last_name, team, position, sfPositionRank, positionRank, age, experience,
                 sf_value, value, sleeperId=None, college=None, injury_status=None, weight=None, height=None,
                 jersey_number=-1, active=None):
        self.id = id
        self.name = name
        self.first_name = first_name
        self.last_name = last_name
        self.team = team
        self.position = position
        self.sfPositionRank = sfPositionRank
        self.positionRank = positionRank
        self.age = age
        self.experience = experience
        self.sf_value = sf_value
        self.value = value
        self.sleeperId = sleeperId
        self.college = college
        self.injury_status = injury_status
        self.weight = weight
        self.height = height
        self.jersey_number = jersey_number
        self.active = active

    def toString(self):
        print(self.id, self.name, self.first_name, self.last_name, self.team, self.position, self.sfPositionRank,
              self.positionRank, self.age, self.experience, self.sf_value, self.value, self.sleeperId, self.college,
              self.injury_status, self.weight, self.height, self.jersey_number, self.active)


#################################
#       Scraping KTC data       #
#  written by: Jeremy Timperio  #
#################################

# URL to scrape data uses requests import
sf_URL = 'https://keeptradecut.com/dynasty-rankings?format=2'
sf_page = requests.get(sf_URL)

# Set up scraper
sf_soup = BeautifulSoup(sf_page.content, 'html.parser')

# fetch each ranking div
sf_rankings = sf_soup.find_all("div", {"class": "onePlayer"})

# URL to scrape data uses requests import
URL = 'https://keeptradecut.com/dynasty-rankings?format=1'
page = requests.get(URL)

# Set up scraper
soup = BeautifulSoup(page.content, 'html.parser')

# fetch each ranking div
rankings = soup.find_all("div", {"class": "onePlayer"})

# players class array of scraped data
players = []

# create dict of sleeper ids and name ids
sleeperIdMapper = getSleeperData()

# loop through ranking divs and create player classes
for player in sf_rankings:
    playerName = (player.find('div', 'player-name')).find('a')
    splitName = playerName.text.strip().split(" ", 1)
    playerFirstName = splitName[0]
    playerLastName = splitName[1]
    playerTeam = player.find('span', 'player-team')
    playerPosition = player.find('p', 'position')
    playerAge = player.find('p', 'position hidden-xs')
    sfTradeValue = (player.find('div', 'value')).find('p')
    playerId = cleanPlayerIdString(str(playerName.text.strip() + str(playerPosition.text.strip())[:2]))
    for oneQbPlayer in rankings:
        tempName = (oneQbPlayer.find('div', 'player-name')).find('a')
        tempPos = oneQbPlayer.find('p', 'position')
        tempId = cleanPlayerIdString(str(tempName.text.strip() + str(tempPos.text.strip())[:2]))
        if playerId == tempId:
            tradeValue = (oneQbPlayer.find('div', 'value')).find('p')
            oneQBPostion = oneQbPlayer.find('p', 'position')
    sleeperId = None
    if str(playerPosition.text.strip().lower()) != 'pick':
        for nameId, value in sleeperIdMapper.items():
            if playerId == nameId:
                sleeperId = value
                break
            # handles double positions
            if playerId[:-2] == nameId[:-2] and (
                    playerPosition.text.strip()[:2] == 'WR' or playerPosition.text.strip()[:2] == 'RB'):
                if nameId[-2:] == 'wr' and playerPosition.text.strip()[:2] == 'RB':
                    print('Double Position: ' + nameId)
                    sleeperId = value
                    break
                if nameId[-2:] == 'rb' and playerPosition.text.strip()[:2] == 'WR':
                    print('Double Position: ' + nameId)
                    sleeperId = value
                    break
            if playerId[:-2] == nameId[:-2] and (
                    playerPosition.text.strip()[:2] == 'TE' or playerPosition.text.strip()[:2] == 'WR'):
                if nameId[-2:] == 'te' and playerPosition.text.strip()[:2] == 'WR':
                    sleeperId = value
                    print('Double Position: ' + nameId)
                    break
    playerExp, jerseyNum = 0, 0
    college, injuryStatus, active, weight, height = None, None, None, None, None
    if sleeperId is not None:
        try:
            sleeperPlayer = sleeperData.get(sleeperId)
            playerExp = sleeperPlayer['years_exp']
            college = sleeperPlayer['college']
            injuryStatus = sleeperPlayer['injury_status']
            weight = sleeperPlayer['weight']
            height = sleeperPlayer['height']
            jerseyNum = sleeperPlayer['number']
            active = sleeperPlayer['active']
        except:
            print('Error getting playerExp for: ' + sleeperId)
    players.append(
        Player(playerId, playerName.text.strip(), playerFirstName, playerLastName, playerTeam.text.strip(),
               str(playerPosition.text.strip())[:2],
               None if str(playerPosition.text.strip())[2:] == 'CK' else str(playerPosition.text.strip())[2:],
               None if str(oneQBPostion.text.strip())[2:] == 'CK' else str(oneQBPostion.text.strip())[2:],
               None if playerAge is None else str(playerAge.text.strip())[:2], playerExp,
               sfTradeValue.text.strip(), tradeValue.text.strip(), sleeperId, college, injuryStatus, weight, height,
               jerseyNum, active))

# for player in players:
#      player.toString()

#################################
#    Insert data into table     #
#  written by: Jeremy Timperio  #
#################################

try:
    # Establishing the connection
    conn = psycopg2.connect(
        database=os.environ['DO_DATABASE'], user=os.environ['DO_DB_USER'], password=os.environ['DO_DB_PASSWORD'], host=os.environ['DO_DB_HOST'], port=os.environ['DO_DB_PORT']
    )

    # conn = psycopg2.connect(
    #     database="docker", user='docker', password='docker', host='db', port='5432'
    # )

    # Setting auto commit false
    conn.autocommit = True

    # Creating a cursor object using the cursor() method
    cursor = conn.cursor()
    try:
        # Preparing SQL queries to INSERT a record into the database.
        for player in players:
            if player.sleeperId is None and player.position != 'PI': print(player.name + ': Error finding Sleeper Id')
            if player.sleeperId is not None and player.position != 'PI':
                # player info table insert
                playerInfoStatement = '''INSERT INTO player_info (name_id, full_name, first_name, last_name, team, position, age, experience, college, injury_status, weight, height, jersey_number, active) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (name_id) DO UPDATE
                    SET
                    name_id = %s,
                    full_name = %s,
                    first_name = %s,
                    last_name = %s,
                    team = %s,
                    position = %s,
                    age = %s,
                    experience = %s,
                    college = %s,
                    injury_status = %s,
                    weight = %s,
                    height = %s,
                    jersey_number = %s,
                    active = %s,
                    updated_at = now(); '''
                cursor.execute(playerInfoStatement, (
                    player.id, player.name, player.first_name, player.last_name, player.team, player.position,
                    player.age,
                    player.experience, player.college, player.injury_status, player.weight, player.height,
                    player.jersey_number, player.active, player.id, player.name, player.first_name, player.last_name,
                    player.team, player.position, player.age, player.experience, player.college, player.injury_status,
                    player.weight, player.height, player.jersey_number, player.active))

                # player id linking table insert
                playerIdsStatement = '''INSERT INTO player_ids (name_id, sleeper_id) VALUES (%s, %s)
                    ON CONFLICT (name_id) DO UPDATE
                    SET
                    name_id = %s,
                    sleeper_id = %s,
                    updated_at = now(); '''
                cursor.execute(playerIdsStatement, (player.id, player.sleeperId, player.id, player.sleeperId))

            # player values insert daily values
            cursor.execute('''INSERT into player_values(name_id, sf_position_rank, position_rank, sf_trade_value, trade_value)
            VALUES (%s, %s, %s, %s, %s)''', (
                player.id, player.sfPositionRank, player.positionRank, player.sf_value, player.value))

        # Commit your changes in the database
        conn.commit()
        print(str(len(players)) + " Records inserted........")
    except (Exception, psycopg2.DatabaseError) as error:
        print("Error inserting data", error)
    # Closing the connection
    conn.close()
except Exception as error:
    print("ERROR IN CONNECTION", error)
