import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const AUTH_PASSWORD = process.env.REACT_APP_PASSWD;
const LOCK_FILE_PATH = path.join(process.cwd(), 'auth_lock.json'); 
const minutesToMilliseconds = (minutes: number): number => minutes * 60 * 1000;

// Extraire les minutes de la chaîne de mot de passe
const extractDurationFromPassword = (password: string): number => {
  const regex = new RegExp(`${AUTH_PASSWORD}(\\d+)$`); // Cherche une durée après le mot de passe
  const match = password.match(regex);
  if (match && match[1]) {
    const durationInMinutes = parseInt(match[1], 10);
    return minutesToMilliseconds(durationInMinutes);
  }
  return 0; // Si pas de durée, renvoyer la durée par défaut
};

function logAttempt(req: NextApiRequest, password: string, success: boolean) {
  const now = new Date();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const logEntry = `${now.toISOString()} | IP: ${ip} | Password: ${password} | Success: ${success}\n`;
  const logFilePath = path.join(process.cwd(), 'auth_log.txt');
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
}
 
function checkAuthLock(): boolean {
  try {
    if (fs.existsSync(LOCK_FILE_PATH)) {
      const lockData = JSON.parse(fs.readFileSync(LOCK_FILE_PATH, 'utf8'));
      if (Date.now() < lockData.timestamp) {
        return true;
      } else {
        console.error("Please login");
      }
    }
  } catch (error) {
    console.error('Error checking auth lock:', error);
  }
  return false;
}

function setAuthLock(duration: number) {
  try {
    fs.writeFileSync(LOCK_FILE_PATH, JSON.stringify({ timestamp: Date.now() + duration }));
  } catch (error) {
    console.error('Error setting auth lock:', error);
  }
} 

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  /* Autologin mode */
  if (checkAuthLock()) {
    logAttempt(req, 'AutoAuth', true);
    res.status(200).json({ success: true, message: 'Authorized (Auto)' });
    console.error("Autologin enable");
    return;
  }
  /* Password mode */
  if (req.method === 'POST') {
    const { password } = req.body;
    
    if (AUTH_PASSWORD === undefined) {
      console.error('REACT_APP_PASSWD n\'est pas défini');
      res.status(500).json({ success: false, message: 'Erreur de configuration du serveur' });
      return;
    }

    // Vérifie si le mot de passe est correct
    if (password.startsWith(AUTH_PASSWORD)) {
      const authDuration = extractDurationFromPassword(password);
      // Applique la durée à la fonction de verrouillage
      logAttempt(req, 'CorrectPwd: ' + `${authDuration / 60000}`, true);
      setAuthLock(authDuration);
      console.log(`Déverrouillage pour ${authDuration / 60000} minutes.`);
      res.status(200).json({ success: true, message: 'Authorized' });
    } else {
      logAttempt(req, password, false);
      console.log("Mot de passe incorrect.");
      res.status(401).json({ success: false, message: 'Incorrect password' });
    }
  } 
  else if (req.method === 'GET') {
    res.status(200).json({ authorized: false }); 
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}