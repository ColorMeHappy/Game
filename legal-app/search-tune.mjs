import fs from'node:fs';
const root='legal-app';
const lessonPriority={
  'tax-03':['rémunération ou dividendes'],
  'corp-02':['дать деньги SCI без изменения долей']
};
const casePriority={
  're-case-10':['locataire impaye hiver caution'],
  'corp-case-03':['SASU investor 25% actions'],
  'imm-case-01':['visiteur veut travailler freelance'],
  're-case-09':['SCI associé met plus argent 50 50'],
  'case10':['dépôt garantie retard 10%'],
  'case6':['délai OQTF assignation 7 jours']
};
const searchPath=`${root}/content/search/core.json`,casePath=`${root}/content/cases/index-v2.json`;
const search=JSON.parse(fs.readFileSync(searchPath,'utf8'));for(const item of search.items||[]){if(lessonPriority[item.id])item.priorityQueries=lessonPriority[item.id];else delete item.priorityQueries}fs.writeFileSync(searchPath,JSON.stringify(search));
const cases=JSON.parse(fs.readFileSync(casePath,'utf8'));for(const item of cases.cases||[]){if(casePriority[item.id])item.priorityQueries=casePriority[item.id];else delete item.priorityQueries}fs.writeFileSync(casePath,JSON.stringify(cases));
console.log('Applied curated priorityQueries to Search metadata');