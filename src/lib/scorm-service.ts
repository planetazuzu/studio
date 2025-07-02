'use server';

import type { Course } from './types';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function generateManifestXML(course: Course): Promise<string> {
  const courseIdentifier = `COURSE-${course.id}`;
  const organizationIdentifier = `ORG-${course.id}`;

  const moduleItems = course.modules.map((module) => `
      <item identifier="ITEM-${module.id}" identifierref="RESOURCE-${module.id}">
        <title>${escapeXml(module.title)}</title>
      </item>`).join('');

  const moduleResources = course.modules.map((module, index) => `
    <resource identifier="RESOURCE-${module.id}" type="webcontent" adlcp:scormtype="sco" href="content/module_${index + 1}.html">
      <file href="content/module_${index + 1}.html" />
    </resource>`).join('');

  const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="MANIFEST-${course.id}" version="1.2"
    xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
    xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
    
    <metadata>
        <schema>ADL SCORM</schema>
        <schemaversion>1.2</schemaversion>
        <lom xmlns="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1">
            <general>
                <title>
                    <langstring xml:lang="es">${escapeXml(course.title)}</langstring>
                </title>
                <description>
                    <langstring xml:lang="es">${escapeXml(course.description)}</langstring>
                </description>
            </general>
        </lom>
    </metadata>
    
    <organizations default="${organizationIdentifier}">
        <organization identifier="${organizationIdentifier}">
            <title>${escapeXml(course.title)}</title>
            ${moduleItems}
        </organization>
    </organizations>
    
    <resources>
        ${moduleResources}
    </resources>
</manifest>`;

  return xmlString.trim();
}
