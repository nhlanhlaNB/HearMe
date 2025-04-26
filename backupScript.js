document.addEventListener('DOMContentLoaded', () => {
    const planForm = document.getElementById('planForm');
    const resultsSection = document.getElementById('results');
    const dropdownToggle = document.getElementById('interests-toggle');
    const dropdownMenu = document.getElementById('interests-dropdown');
    const checkboxes = document.querySelectorAll('input[name="interests"]');
    const generatePlanBtn = document.getElementById('generatePlanBtn');

    // Resource buttons
    const resourceButtons = document.querySelectorAll('.resource-btn');
    const resourceResults = document.getElementById('resource-results');
    const resourceTitle = document.getElementById('resource-title');
    const resourceContent = document.getElementById('resource-content');

    // Initial validation for resource elements
    if (!resourceButtons.length || !resourceResults || !resourceTitle || !resourceContent) {
        console.error('Resource elements missing:', {
            resourceButtons: !!resourceButtons.length,
            resourceResults: !!resourceResults,
            resourceTitle: !!resourceTitle,
            resourceContent: !!resourceContent
        });
        return;
    }

    // Store user profile for location-based deadlines
    let userProfile = null;

    // Store recommendations and resources
    let currentRecommendations = null;
    let currentResources = null;

    resourceButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!currentRecommendations || !currentResources) {
                alert('Please create a personalized plan first.');
                document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' });
                return;
            }

            const resourceType = button.dataset.resource;
            console.log(`Resource button clicked: ${resourceType}`);

            const titles = {
                deadlines: 'Application Deadlines',
                scholarships: 'Scholarships',
                careers: 'Careers',
                'study-aids': 'Study Aids'
            };
            resourceTitle.textContent = titles[resourceType] || 'Resource Details';

            const resourceData = currentResources[resourceType] || getMockResourceData(resourceType);
            displayResourceRecommendations(resourceData);
            resourceResults.classList.remove('hidden');
        });
    });

    // Mock data for fallback
    function getMockResourceData(resourceType) {
        const mockData = {
            deadlines: [
                { title: 'University of Cape Town', description: 'Applications open: April 1, 2025. Close: July 31, 2025.', footer: 'April 1 - July 31, 2025' },
                { title: 'Stellenbosch University', description: 'Applications open: March 1, 2025. Close: June 30, 2025.', footer: 'March 1 - June 30, 2025' },
                { title: 'University of Witwatersrand', description: 'Applications open: March 1, 2025. Close: September 30, 2025.', footer: 'March 1 - Sept 30, 2025' }
            ],
            scholarships: [
                { title: 'Merit Award', description: 'For top students.', footer: 'Apply by Dec' },
                { title: 'Need-Based Grant', description: 'Financial aid.', footer: 'Ongoing' }
            ],
            careers: [
                { title: 'Engineer', description: 'Builds tech solutions.', footer: 'High demand' },
                { title: 'Analyst', description: 'Data insights.', footer: 'Growth: 20%' }
            ],
            'study-aids': [
                { title: 'Math Guide', description: 'Algebra basics.', footer: 'Free' },
                { title: 'Science Quiz', description: 'Exam prep.', footer: '2025 edition' }
            ]
        };
        return mockData[resourceType] || [];
    }

    // Display resource recommendations
    function displayResourceRecommendations(items) {
        const createCard = ({ title, description, footer }) => `
            <div class="recommendation-card">
                <h4>${title || 'Untitled'}</h4>
                <p>${description || 'No description'}</p>
                <div class="recommendation-footer">${footer || ''}</div>
            </div>
        `;
        resourceContent.innerHTML = (items || []).map(createCard).join('');
    }

    // Initial validation for form elements
    if (!planForm || !resultsSection || !dropdownToggle || !dropdownMenu || !generatePlanBtn) {
        console.error('Critical elements missing:', {
            planForm: !!planForm,
            resultsSection: !!resultsSection,
            dropdownToggle: !!dropdownToggle,
            dropdownMenu: !!dropdownMenu,
            generatePlanBtn: !!generatePlanBtn
        });
        alert('Site initialization failed. Check console for details.');
        return;
    }

    // Navigation
    document.querySelectorAll('.main-nav a, .navbar-nav a').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.main-nav a, .navbar-nav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            console.log(`Navigated to ${link.getAttribute('href')}`);
        });
    });

    // Dropdown toggle
    dropdownToggle.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
        console.log('Dropdown toggle clicked');
    });

    // Prevent dropdown from closing when clicking checkboxes
    dropdownMenu.addEventListener('click', e => {
        if (e.target.closest('.dropdown-item')) {
            e.stopPropagation();
            console.log('Checkbox clicked, dropdown stays open');
        }
    });

    // Close dropdown on outside click
    document.addEventListener('click', e => {
        if (!e.target.closest('.dropdown')) {
            dropdownMenu.classList.remove('show');
        }
    });

    // Update dropdown text
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selected = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            dropdownToggle.textContent = selected.length === 0 ? 'Select interests' : selected.length <= 2 ? selected.join(', ') : `${selected.length} interests selected`;
            console.log('Selected interests:', selected);
        });
    });

    // Form submission
    planForm.addEventListener('submit', async e => {
        e.preventDefault();
        console.log('Form submitted');

        const data = {
            gradeLevel: document.getElementById('gradeLevel')?.value || '',
            interests: Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value),
            province: document.getElementById('province')?.value || '',
            city: document.getElementById('city')?.value || '',
            income: document.getElementById('income')?.value || '',
            age: document.getElementById('age')?.value || '',
            gender: document.getElementById('gender')?.value || ''
        };

        console.log('Form data:', data);

        if (!data.gradeLevel || !data.province || !data.city || !data.income || !data.age || !data.gender || !data.interests.length === 0) {
            alert('Please complete all fields and select at least one interest.');
            console.error('Validation failed');
            return;
        }

        generatePlanBtn.textContent = 'Generating...';
        generatePlanBtn.disabled = true;

        try {
            const { plan, resources } = await generatePlan(data);
            currentRecommendations = plan;
            currentResources = resources;
            userProfile = data;
            displayRecommendations(plan);
            resultsSection.classList.remove('hidden');
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error generating plan and resources:', error.message);
            console.error('Stack trace:', error.stack);
            alert('Failed to generate plan and resources. Using sample data.');
            const mockPlan = {
                subjects: [{ title: 'Mathematics', description: 'Builds analytical skills for STEM fields.', footer: 'High priority' }],
                universities: [{ title: 'Local University', description: 'Offers programs in your area.', footer: 'Apply by Jan' }],
                funding: [{ title: 'Merit Scholarship', description: 'Based on academic performance.', footer: 'Deadline: Dec' }],
                careers: [{ title: 'Data Analyst', description: 'High-demand role in tech.', footer: 'Growth: 20%' }]
            };
            const mockResources = {
                deadlines: getMockResourceData('deadlines'),
                scholarships: getMockResourceData('scholarships'),
                careers: getMockResourceData('careers'),
                'study-aids': getMockResourceData('study-aids')
            };
            currentRecommendations = mockPlan;
            currentResources = mockResources;
            userProfile = data;
            displayRecommendations(mockPlan);
            resultsSection.classList.remove('hidden');
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        } finally {
            generatePlanBtn.textContent = 'Generate Plan';
            generatePlanBtn.disabled = false;
        }
    });

    // Tab navigation
    document.querySelectorAll('.tabs li').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tabs li').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab)?.classList.add('active');
        });
    });

    async function generatePlan(data) {
        const prompt = `
            Return a JSON object with two main keys: "plan" and "resources". 
            - The "plan" key should map to an object with four keys: "subjects", "universities", "funding", and "careers". Each of these keys should map to an array of objects, where each object has "title", "description", and "footer" properties as strings.
            - The "resources" key should map to an object with four keys: "deadlines", "scholarships", "careers", and "study-aids". Each of these keys should map to an array of objects, where each object has "title", "description", and "footer" properties as strings.
            Do not include any explanatory text, markdown, or code blocks—only the JSON object. Provide personalized academic and career recommendations and resources based on the following profile:
            - Grade: ${data.gradeLevel}
            - Interests: ${data.interests.join(', ')}
            - Province: ${data.province}
            - City: ${data.city}
            - Income: ${data.income}
            - Age: ${data.age}
            - Gender: ${data.gender}
        `;
    
        const models = [
            'google/gemini-2.0-flash-exp:free',
            'nvidia/nvidia-chat-v1',
            'meta-llama/llama-3-8b-instruct',
            'deepseek/deepseek-chat-v3-0324:free'
            
        ];
    
        for (const model of models) {
            try {
                console.log(`Trying model: ${model}`);
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer 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',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        messages: [{ role: 'user', content: prompt }]
                    })
                });
    
                if (!response.ok) {
                    console.error(`Model ${model} failed with status: ${response.status}`);
                    continue; // Try the next model
                }
    
                const result = await response.json();
                if (!result.choices?.[0]?.message?.content) {
                    console.error(`Model ${model} returned an invalid response`);
                    continue; // Try the next model
                }
    
                const content = result.choices[0].message.content.trim();
                console.log('Raw API response:', content);
    
                // Clean and extract JSON
                const jsonMatch = content.match(/{[\s\S]*}/);
                if (!jsonMatch) {
                    console.error(`No valid JSON found in response from ${model}`);
                    continue; // Try the next model
                }
    
                const parsedContent = JSON.parse(jsonMatch[0]);
                if (!parsedContent.plan || !parsedContent.resources) {
                    console.error(`Missing keys in response from ${model}`);
                    continue; // Try the next model
                }
    
                // Success! Return parsed data
                return {
                    plan: parsedContent.plan,
                    resources: parsedContent.resources
                };
            } catch (error) {
                console.error(`Error with model ${model}:`, error.message);
            }
        }
    
        // If all models fail
        throw new Error('All models failed to generate a plan and resources.');
    }
    
    // Display recommendations
    function displayRecommendations({ subjects, universities, funding, careers }) {
        const createCard = ({ title, description, footer }) => `
            <div class="recommendation-card">
                <h4>${title || 'Untitled'}</h4>
                <p>${description || 'No description'}</p>
                <div class="recommendation-footer">${footer || ''}</div>
            </div>
        `;
        document.getElementById('subjects-content').innerHTML = (subjects || []).map(createCard).join('');
        document.getElementById('universities-content').innerHTML = (universities || []).map(createCard).join('');
        document.getElementById('funding-content').innerHTML = (funding || []).map(createCard).join('');
        document.getElementById('careers-content').innerHTML = (careers || []).map(createCard).join('');
    }

    // Action buttons
    const downloadPlanBtn = document.getElementById('downloadPlanBtn');
    const printPlanBtn = document.getElementById('printPlanBtn');
    const createNewPlanBtn = document.getElementById('createNewPlanBtn');

    if (printPlanBtn) {
        printPlanBtn.addEventListener('click', async () => {
            if (!currentRecommendations || !currentResources) {
                alert('No plan or resources available to print.');
                return;
            }
    
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
    
            const margin = 10;
            const pageWidth = 210; // A4 width in mm
            const maxLogoWidth = 40; // Maximum width for the logo in mm
            let yPosition = margin;
    
            // Function to load image and get dimensions
            const loadImage = (url) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error('Failed to load image'));
                });
            };
    
            // Add the logo with proper sizing
            try {
                const logoPath = 'assets/images/GritLab Logo.png';
                const img = await loadImage(logoPath);
    
                // Calculate dimensions while preserving aspect ratio
                const aspectRatio = img.width / img.height;
                const logoWidth = maxLogoWidth;
                const logoHeight = logoWidth / aspectRatio;
    
                // Ensure the logo doesn't exceed a reasonable height
                const maxLogoHeight = 20; // Maximum height in mm
                const finalWidth = logoHeight > maxLogoHeight ? maxLogoHeight * aspectRatio : logoWidth;
                const finalHeight = logoHeight > maxLogoHeight ? maxLogoHeight : logoHeight;
    
                // Position the logo at the top-right
                const logoX = pageWidth - margin - finalWidth;
                const logoY = margin;
    
                doc.addImage(logoPath, 'PNG', logoX, logoY, finalWidth, finalHeight);
                yPosition += finalHeight + 5; // Adjust yPosition to account for logo height
            } catch (e) {
                console.warn('Logo could not be added:', e.message);
            }
    
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(0, 51, 102);
            doc.text('AI Dad Pathway Planner', margin, yPosition);
            yPosition += 10;
    
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text('Personalized Academic & Career Plan', margin, yPosition);
            yPosition += 6;
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
            yPosition += 10;
    
            const addSection = (title, items) => {
                if (!items || items.length === 0) return;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(0, 51, 102);
                doc.text(title, margin, yPosition);
                yPosition += 8;
    
                doc.setLineWidth(0.5);
                doc.setDrawColor(0, 51, 102);
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 5;
    
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                items.forEach(item => {
                    if (yPosition > 270) {
                        doc.addPage();
                        yPosition = margin;
                    }
                    const bulletText = `${item.title}: ${item.description} (${item.footer})`;
                    const lines = doc.splitTextToSize(`• ${bulletText}`, pageWidth - 2 * margin - 5);
                    doc.text(lines, margin + 5, yPosition);
                    yPosition += lines.length * 5 + 3;
                });
                yPosition += 5;
            };
    
            // Add plan sections
            addSection('Recommended Subjects', currentRecommendations.subjects || []);
            addSection('University Options', currentRecommendations.universities || []);
            addSection('Funding Opportunities', currentRecommendations.funding || []);
            addSection('Career Pathways', currentRecommendations.careers || []);
    
            // Add resource sections
            addSection('Application Deadlines', currentResources.deadlines || []);
            addSection('Scholarships', currentResources.scholarships || []);
            addSection('Career Resources', currentResources.careers || []);
            addSection('Study Aids', currentResources['study-aids'] || []);
    
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('© 2025 AI Dad Pathway Planner. All rights reserved.', margin, 287, { align: 'left' });
            doc.text('Generated by AI Dad', pageWidth - margin, 287, { align: 'right' });
    
            // Instead of saving the PDF, open it in a new tab and trigger printing
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
    
            // Open the PDF in a new tab
            const printWindow = window.open(pdfUrl, '_blank');
            printWindow.onload = () => {
                // Trigger the print dialog
                printWindow.print();
            };
        });
    }

    if (createNewPlanBtn) {
        createNewPlanBtn.addEventListener('click', () => {
            resultsSection.classList.add('hidden');
            resourceResults.classList.add('hidden');
            planForm.reset();
            dropdownToggle.textContent = 'Select interests';
            checkboxes.forEach(cb => (cb.checked = false));
            currentRecommendations = null;
            currentResources = null;
            document.getElementById('province').value = '';
            document.getElementById('city').innerHTML = '<option value="">Select City/Town</option>';
            document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' });
        });
    }
});