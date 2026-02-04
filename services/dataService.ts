import { PaperRecord } from '../types';

const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRc4XwuY5BY6-23T6vTXr5zqpqOn6pZepIM4ygd4wadZGl9ilpuN6hZZIXskYHHzxgTcUAKdsSqe60Y/pub?gid=1642364281&single=true&output=csv";

// Robust CSV Parser helper
const parseCSV = (text: string): PaperRecord[] => {
  // Handle CRLF or LF
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  
  if (lines.length === 0) return [];

  // Extract headers
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Map rows to objects
  return lines.slice(1).map(line => {
    // Regex to split by comma ONLY if not inside quotes
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => {
      let val = v.trim();
      // Remove surrounding quotes if present
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      return val.trim();
    });

    const entry: any = {};
    
    headers.forEach((header, index) => {
      const val = values[index];
      
      // Type casting based on known columns
      if (['pages_per_sheet', 'total_pages', 'copies', 'sheet_used'].includes(header)) {
        // Handle numbers that might have commas (e.g., "1,200")
        const cleanVal = val ? val.replace(/,/g, '') : '0';
        entry[header] = Number(cleanVal) || 0;
      } else {
        entry[header] = val;
      }
    });
    
    return entry as PaperRecord;
  });
};

export const fetchPaperData = async (): Promise<PaperRecord[]> => {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error("Error loading paper data:", error);
    throw error;
  }
};