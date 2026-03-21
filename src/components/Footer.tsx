import React, { useState } from 'react';
import { Shield, Phone, Mail, FileText, ExternalLink, X, Book, Lock, FileCheck, Headphones } from 'lucide-react';

type DialogType = 'documentation' | 'privacy' | 'terms' | 'support' | null;

export function Footer() {
  const [openDialog, setOpenDialog] = useState<DialogType>(null);

  const closeDialog = () => setOpenDialog(null);

  const renderDialogContent = () => {
    switch(openDialog) {
      case 'documentation':
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#3BE39C]/10 rounded-lg">
                <Book className="w-6 h-6 text-[#3BE39C]" />
              </div>
              <h3 className="text-2xl font-bold text-white">System Documentation</h3>
            </div>
            <div className="space-y-6 text-gray-300">
              <div>
                <h4 className="text-white font-semibold mb-2">Getting Started</h4>
                <p className="text-sm">CrimeShield AI is an advanced surveillance and crime detection platform designed for law enforcement and security organizations.</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Key Features</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#3BE39C] mt-1">•</span>
                    <span>Live CCTV Feed Monitoring with AI-powered threat detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3BE39C] mt-1">•</span>
                    <span>Crime Hotspot Heatmaps with predictive analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3BE39C] mt-1">•</span>
                    <span>Real-time Alert System with severity classification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3BE39C] mt-1">•</span>
                    <span>Digital Evidence Management and storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3BE39C] mt-1">•</span>
                    <span>Role-based Access Control (Organizations vs Citizens)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Technical Specifications</h4>
                <p className="text-sm">System Version: 3.2.1 | Framework: React + AI/ML Integration | Authentication: DigiLocker</p>
              </div>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#FF6EC7]/10 rounded-lg">
                <Lock className="w-6 h-6 text-[#FF6EC7]" />
              </div>
              <h3 className="text-2xl font-bold text-white">Privacy Policy</h3>
            </div>
            <div className="space-y-6 text-gray-300">
              <div>
                <h4 className="text-white font-semibold mb-2">Data Collection</h4>
                <p className="text-sm">CrimeShield AI collects and processes surveillance data, user credentials, and location information solely for law enforcement and public safety purposes.</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Data Usage</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6EC7] mt-1">•</span>
                    <span>Video feeds are processed using AI algorithms for threat detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6EC7] mt-1">•</span>
                    <span>User authentication is handled through DigiLocker for verified identity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6EC7] mt-1">•</span>
                    <span>Location data is used only for providing relevant safety information</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Data Security</h4>
                <p className="text-sm">All data is encrypted in transit and at rest. Access is restricted based on user roles and organizational clearance levels.</p>
              </div>
              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
                <p className="text-yellow-400 text-sm"><strong>Important:</strong> This system is not designed for collecting PII or securing sensitive personal data beyond law enforcement requirements.</p>
              </div>
            </div>
          </div>
        );
      case 'terms':
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-400/10 rounded-lg">
                <FileCheck className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Terms of Service</h3>
            </div>
            <div className="space-y-6 text-gray-300">
              <div>
                <h4 className="text-white font-semibold mb-2">Authorized Use</h4>
                <p className="text-sm">This system is exclusively for authorized law enforcement personnel and approved security organizations. Unauthorized access is strictly prohibited.</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">User Responsibilities</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Maintain confidentiality of access credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Use the system only for legitimate law enforcement purposes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Report any security incidents or system misuse immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Comply with all applicable laws and regulations</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Limitations of Liability</h4>
                <p className="text-sm">The system is provided "as-is" for crime prevention purposes. While we strive for accuracy, AI predictions should be verified before taking action.</p>
              </div>
              <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                <p className="text-red-400 text-sm"><strong>Legal Notice:</strong> Unauthorized access or misuse may result in prosecution under applicable laws.</p>
              </div>
            </div>
          </div>
        );
      case 'support':
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#3BE39C]/10 rounded-lg">
                <Headphones className="w-6 h-6 text-[#3BE39C]" />
              </div>
              <h3 className="text-2xl font-bold text-white">Technical Support</h3>
            </div>
            <div className="space-y-6 text-gray-300">
              <div>
                <h4 className="text-white font-semibold mb-2">Support Channels</h4>
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-[#3BE39C]" />
                      <span className="text-white font-medium">24/7 Helpline</span>
                    </div>
                    <p className="text-sm">Call (555) 123-4567 for immediate technical assistance</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-[#3BE39C]" />
                      <span className="text-white font-medium">Email Support</span>
                    </div>
                    <p className="text-sm">support@crimeshield.gov (Response within 4 hours)</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Common Issues</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#3BE39C] mt-1">•</span>
                    <span>Camera feed not loading: Check network connection and camera status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3BE39C] mt-1">•</span>
                    <span>Authentication errors: Verify DigiLocker credentials and retry</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3BE39C] mt-1">•</span>
                    <span>Alert notifications delayed: Clear browser cache and refresh page</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">System Status</h4>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#3BE39C] rounded-full animate-pulse"></div>
                  <span className="text-sm">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <footer className="bg-[#0B1D3A] border-t border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand & Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-[#3BE39C] rounded-lg">
                  <Shield className="w-5 h-5 text-[#0B1D3A]" />
                </div>
                <h3 className="text-xl font-bold text-white">CrimeShield AI</h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Advanced AI-powered crime detection and prevention system providing real-time surveillance 
                monitoring and predictive analytics for enhanced public safety.
              </p>
              <div className="text-xs text-gray-500">
                <p className="mb-2">
                  <strong>Disclaimer:</strong> This system is designed for law enforcement and security purposes only. 
                  All data processing complies with applicable privacy laws and regulations.
                </p>
                <p>
                  <strong>Legal Notice:</strong> Unauthorized access or misuse of this system is prohibited 
                  and may result in prosecution under applicable laws.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-white font-medium mb-4">Emergency Services (India)</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-[#FF6EC7]" />
                  <div>
                    <div className="text-white font-medium">112</div>
                    <div className="text-gray-400 text-sm">National Emergency Number</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-[#3BE39C]" />
                  <div>
                    <div className="text-white font-medium">100</div>
                    <div className="text-gray-400 text-sm">Police</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-orange-400" />
                  <div>
                    <div className="text-white font-medium">108</div>
                    <div className="text-gray-400 text-sm">Ambulance</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-red-400" />
                  <div>
                    <div className="text-white font-medium">101</div>
                    <div className="text-gray-400 text-sm">Fire Service</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-pink-400" />
                  <div>
                    <div className="text-white font-medium">1091</div>
                    <div className="text-gray-400 text-sm">Women Helpline</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">control@crimeshield.gov.in</div>
                    <div className="text-gray-400 text-sm">Control Center</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentation & Support */}
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => setOpenDialog('documentation')}
                  className="flex items-center space-x-2 text-gray-400 hover:text-[#3BE39C] transition-colors w-full text-left"
                >
                  <FileText className="w-4 h-4" />
                  <span>System Documentation</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => setOpenDialog('privacy')}
                  className="flex items-center space-x-2 text-gray-400 hover:text-[#3BE39C] transition-colors w-full text-left"
                >
                  <FileText className="w-4 h-4" />
                  <span>Privacy Policy</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => setOpenDialog('terms')}
                  className="flex items-center space-x-2 text-gray-400 hover:text-[#3BE39C] transition-colors w-full text-left"
                >
                  <FileText className="w-4 h-4" />
                  <span>Terms of Service</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => setOpenDialog('support')}
                  className="flex items-center space-x-2 text-gray-400 hover:text-[#3BE39C] transition-colors w-full text-left"
                >
                  <Phone className="w-4 h-4" />
                  <span>Technical Support</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-8 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 CrimeShield AI. All rights reserved. | Developed for law enforcement agencies.
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#3BE39C] rounded-full"></div>
                  <span className="text-gray-400">System Online</span>
                </div>
                <div className="text-gray-400">Version 3.2.1</div>
                <div className="text-gray-400">Last Updated: Jan 7, 2024</div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Dialog Overlay */}
      {openDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B1D3A] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0B1D3A] border-b border-white/10 p-6 flex items-center justify-between">
              <div className="w-8"></div>
              <button 
                onClick={closeDialog}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              {renderDialogContent()}
            </div>
            <div className="sticky bottom-0 bg-[#0B1D3A] border-t border-white/10 p-6 flex justify-end">
              <button 
                onClick={closeDialog}
                className="px-6 py-2 bg-[#3BE39C] text-[#0B1D3A] rounded-lg hover:bg-[#3BE39C]/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}