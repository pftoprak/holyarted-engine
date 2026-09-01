import abilities from '../data/abilities.json';
import idealJobs from '../data/ideal_job.json';
import showcase from '../data/showcase.json';

type ContentMap = Record<string, string>;

const letterValues: Record<string, number> = {
  A: 1, B: 2, C: 3, Ç: 3, D: 4, E: 5, F: 6, G: 7, Ğ: 7, H: 8, I: 9, İ: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, Ö: 6, P: 7, Q: 8, R: 9, S: 1, Ş: 1,
  T: 2, U: 3, Ü: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

function reduceNumber(total: number) {
  let value = total;
  while (value > 9 && ![11, 22, 33].includes(value)) {
    value = String(value).split('').reduce((sum, digit) => sum + Number(digit), 0);
  }
  return value;
}

function pick(map: ContentMap, number: number) {
  return map[String(number)] ?? map[String(reduceNumber(number))] ?? map['9'];
}

export function calculateProfile(name: string, birthDate: string) {
  const birthTotal = birthDate.replace(/\D/g, '').split('').reduce((sum, digit) => sum + Number(digit), 0);
  const nameTotal = [...name.toLocaleUpperCase('tr-TR')].reduce((sum, letter) => sum + (letterValues[letter] ?? 0), 0);
  const lifeNumber = reduceNumber(birthTotal);
  const expressionNumber = reduceNumber(nameTotal);
  const directionNumber = reduceNumber(lifeNumber + expressionNumber);
  return {
    name: name.trim() || 'Sen',
    lifeNumber,
    sections: [
      { key: 'essence', title: 'Öz enerjin', number: lifeNumber, content: pick(showcase as ContentMap, lifeNumber) },
      { key: 'gift', title: 'Doğal yeteneğin', number: expressionNumber, content: pick(abilities as ContentMap, expressionNumber) },
      { key: 'work', title: 'Üretim yönün', number: directionNumber, content: pick(idealJobs as ContentMap, directionNumber) },
    ],
  };
}
