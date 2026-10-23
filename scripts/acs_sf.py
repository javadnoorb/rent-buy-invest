"""Reader for the Census ACS table-based summary files (no API key needed): one pipe-delimited file per table covering
every geography, streamed so only the wanted rows are kept."""
import urllib.request
SF = 'https://www2.census.gov/programs-surveys/acs/summary_file/{y}/table-based-SF/'

def sf_lines(url, prefixes):
    """Header plus the rows whose GEO_ID starts with one of prefixes."""
    req = urllib.request.Request(url, headers={'User-Agent': 'rent-buy-invest data refresh'})
    with urllib.request.urlopen(req, timeout=600) as r:
        hdr = None; rows = []
        for raw in r:
            line = raw.decode('utf-8', 'replace').rstrip('\r\n')
            if hdr is None: hdr = line.split('|'); ig = hdr.index('GEO_ID'); continue
            if not any(p in line for p in prefixes): continue  # most lines are tracts and block groups
            f = line.split('|')
            if f[ig].startswith(prefixes): rows.append(f)
    return hdr, rows
