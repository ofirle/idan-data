const axios = require('axios');
const {google} = require("googleapis")
const express = require("express");
const schedule = require('node-schedule');

const job = schedule.scheduleJob(' */30 * * * *', async function(){
        try {
                const data = await fetchData();
                console.log(`new row as been added: ${JSON.stringify(data)}`);
        }catch (err) {
                console.log(`failed to fetch data. error: ${err.messag}e`);
        }
});

const app = express();

app.get("/", async (req, res) => {
        try {
                const auth = new google.auth.GoogleAuth({
                        keyFile: "credentials.json",
                        scopes: "https://www.googleapis.com/auth/spreadsheets",
                });
                const client = await auth.getClient();
                const spreadsheetId = "17gGWtBRg8hPa58JCj49I8rNwE20CZxoCi_v0jmlfIec";
                const googleSheets = google.sheets({ version: "v4", auth: client });

                const getRows = await googleSheets.spreadsheets.values.get({
                        auth,
                        spreadsheetId,
                        range: "Sheet1"
                });

                res.send(getRows.data);
        }catch (err){
                console.log(err);
        }
});

const fetchData = async () => {
        try {
                const url = 'https://www.noga-iso.co.il/Umbraco/Api/Documents/GetElectricalData';
                const response = await axios(url)

                const data = response.data;
                const currentPowerConsumption = parseToNumber(data.Production);
                const currentPowerReserve = parseToNumber(data.CurrentReserve);
                const peakLoad = parseToNumber(data.PeakLoad);
                const peakPowerReserve = parseToNumber(data.PeakReserve);
                console.log([currentPowerReserve, currentPowerConsumption, peakLoad, peakPowerReserve, new Date()])

                const auth = new google.auth.GoogleAuth({
                        keyFile: "credentials.json",
                        scopes: "https://www.googleapis.com/auth/spreadsheets",
                });
                const client = await auth.getClient();
                const spreadsheetId = "17gGWtBRg8hPa58JCj49I8rNwE20CZxoCi_v0jmlfIec";
                const googleSheets = google.sheets({version: "v4", auth: client});

                const getRows = await googleSheets.spreadsheets.values.get({
                        auth,
                        spreadsheetId,
                        range: "Sheet1"
                });
                const rows = getRows.data.values;
                const lastRow = rows[rows.length - 1];
                const lastId = lastRow[0];
                const newId = lastId === 'ID' ? 1 : Number(lastId) + 1;
                const date = new Date();
                date.setMinutes(date.getMinutes() + 180)
                await googleSheets.spreadsheets.values.append({
                        auth,
                        spreadsheetId,
                        range: "Sheet1!A:F",
                        valueInputOption: "USER_ENTERED",
                        resource: {
                                values: [
                                        [newId, currentPowerReserve, currentPowerConsumption, peakLoad, peakPowerReserve, date]
                                ],
                        },
                });
                return {
                        id: newId,
                        power_reserve: currentPowerReserve,
                        power_consumption: currentPowerConsumption,
                        peak_load: peakLoad,
                        peak_power_reserve: peakPowerReserve,
                        date: date
                }
        }catch (err){
                throw err;
        }
}

const parseToNumber = (strNumber) => {
        return Number(strNumber.replace(/,/g, ''));
}
//
const PORT = process.env.PORT || 8080;
app.listen(PORT, (req, res) => console.log(`running on ${PORT}`));
// console.log("running on 1337");
//
