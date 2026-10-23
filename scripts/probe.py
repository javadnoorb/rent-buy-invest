import re, urllib.request
H = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'}
t = urllib.request.urlopen(urllib.request.Request('https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/spf-q1-2026', headers=H), timeout=60).read().decode('utf-8', 'replace')
i = t.find('Stock Returns'); j = t.rfind('<table', 0, i); k = t.find('</table>', i)
print(t[j:k+8])
for m in re.finditer(r'(?i)10 years|ten years|10-year', t): print('CTX', re.sub(r'<[^>]+>', ' ', t[max(0, m.start()-300):m.end()+300]).replace('\n', ' ')[:600])
