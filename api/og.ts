import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { name, party, constituency, assets, cases, education } = req.query;

  const politicianName = (Array.isArray(name) ? name[0] : name) || 'Politician';
  const politicianParty = (Array.isArray(party) ? party[0] : party) || '';
  const politicianConstituency = (Array.isArray(constituency) ? constituency[0] : constituency) || '';
  const totalAssets = (Array.isArray(assets) ? assets[0] : assets) || '';
  const criminalCases = (Array.isArray(cases) ? cases[0] : cases) || '';
  const politicianEducation = (Array.isArray(education) ? education[0] : education) || '';

  // Read the logo as base64
  let logoBase64 = '';
  try {
    const logoPath = join(process.cwd(), 'public', 'project-vigil.png');
    const logoBuffer = readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch {
    // Logo won't render if missing
  }

  const statsHtml = [
    totalAssets ? `<div style="display:flex;flex-direction:column;align-items:center;padding:0 24px;border-right:1px solid #2a3140"><div style="font-size:14px;color:#94a3b8;margin-bottom:4px">Assets</div><div style="font-size:20px;font-weight:700;color:#e8963e">${escapeHtml(totalAssets)}</div></div>` : '',
    criminalCases ? `<div style="display:flex;flex-direction:column;align-items:center;padding:0 24px"><div style="font-size:14px;color:#94a3b8;margin-bottom:4px">Criminal Cases</div><div style="font-size:20px;font-weight:700;color:${criminalCases === '0' ? '#34d399' : '#f87171'}">${escapeHtml(criminalCases)}</div></div>` : '',
  ].filter(Boolean).join('');

  const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;display=swap');
    </style>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#0c0f14"/>

  <!-- Top accent line -->
  <rect width="1200" height="4" fill="#e8963e"/>

  <!-- Bottom bar -->
  <rect y="590" width="1200" height="40" fill="#151922"/>

  <foreignObject x="0" y="0" width="1200" height="630">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:1200px;height:630px;display:flex;flex-direction:column;font-family:Inter,sans-serif;color:#f1f3f7">

      <!-- Header -->
      <div style="display:flex;align-items:center;gap:12px;padding:40px 60px 0">
        ${logoBase64 ? `<img src="${logoBase64}" width="48" height="48" style="border-radius:8px"/>` : ''}
        <span style="font-size:22px;font-weight:700;letter-spacing:0.5px">PROJECT <span style="color:#e8963e">VIGIL</span></span>
      </div>

      <!-- Main content -->
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 60px">
        <div style="font-size:52px;font-weight:800;line-height:1.15;margin-bottom:16px">${escapeHtml(politicianName)}</div>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:${politicianEducation ? '12px' : '32px'}">
          ${politicianParty ? `<span style="font-size:22px;color:#e8963e;font-weight:600">${escapeHtml(politicianParty)}</span>` : ''}
          ${politicianConstituency ? `<span style="font-size:18px;color:#94a3b8">${escapeHtml(politicianConstituency)}</span>` : ''}
        </div>
        ${politicianEducation ? `<div style="font-size:16px;color:#64748b;margin-bottom:32px">${escapeHtml(politicianEducation)}</div>` : ''}
        ${statsHtml ? `<div style="display:flex;align-items:center;background:#151922;border:1px solid #2a3140;border-radius:12px;padding:20px 8px;width:fit-content">${statsHtml}</div>` : ''}
      </div>

      <!-- Footer -->
      <div style="padding:0 60px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:#64748b">Transparent Governance Dashboard</span>
        <span style="font-size:13px;color:#64748b">projectvigil.in</span>
      </div>
    </div>
  </foreignObject>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  return res.status(200).send(svg);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
