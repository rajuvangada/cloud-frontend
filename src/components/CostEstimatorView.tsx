import React, { useState, useRef, useEffect } from 'react';
import type { CostEstimationResult } from '../types';
import { exportCostHistoryCSV, exportCostHistoryPDF } from '../utils/export';
import {
  calculateCost,
  calculateS3Cost,
  calculateLambdaCost,
  calculateRdsCost,
  calculateGenericCost,
  fetchServices
} from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ResultCard } from './ResultCard';
import { EmptyState } from './EmptyState';
import {
  TrendingDown,
  Info,
  Layers,
  Cpu,
  Search,
  ChevronDown,
  ChevronUp,
  Database,
  Cloud,
  Activity,
  Shield,
  BarChart,
  Brain,
  Eye,
  Download
} from 'lucide-react';

interface CostEstimatorViewProps {
  onAddEstimate: (result: CostEstimationResult) => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  estimates: CostEstimationResult[];
}

const AWS_CATALOG = [
  {
    category: 'Compute',
    icon: Cpu,
    services: [
      { id: 'ec2', name: 'EC2 Compute Instances', tags: 'virtual server cpu VM compute linux windows instance', fields: 'ec2' },
      { id: 'lambda', name: 'AWS Lambda (Serverless Compute)', tags: 'serverless invocations compute functions microservice python nodejs script', fields: 'lambda' },
      { id: 'ecs', name: 'ECS (Elastic Container Service)', tags: 'container docker compute microservices orchestration fargate task cluster', fields: 'generic', unit: 'vCPU Hours', defaultRate: 0.0406 },
      { id: 'eks', name: 'EKS (Elastic Kubernetes Service)', tags: 'kubernetes containers k8s cluster compute docker pod helm', fields: 'generic', unit: 'Cluster Hours', defaultRate: 0.1000 },
      { id: 'batch', name: 'AWS Batch (Batch Jobs)', tags: 'jobs compute scheduling scale compute containers docker runner queue', fields: 'generic', unit: 'Job Run Hours', defaultRate: 0.0150 },
    ]
  },
  {
    category: 'Storage',
    icon: Cloud,
    services: [
      { id: 's3', name: 'S3 Standard Storage', tags: 'object storage standard files data assets cloud bucket object', fields: 's3' },
      { id: 'ebs', name: 'EBS Volume Storage', tags: 'block storage volume drive SSD harddisk ec2 disk mount backup', fields: 'generic', unit: 'GB-Month', defaultRate: 0.1000 },
      { id: 'efs', name: 'EFS File System Storage', tags: 'shared file system network volume drive nfs mount files serverless elastic', fields: 'generic', unit: 'GB-Month', defaultRate: 0.3000 },
      { id: 'fsx', name: 'FSx Managed File Systems', tags: 'windows file system lustre network files drive windows storage high throughput', fields: 'generic', unit: 'GB-Month', defaultRate: 0.1300 },
    ]
  },
  {
    category: 'Database',
    icon: Database,
    services: [
      { id: 'rds', name: 'RDS Database Instance', tags: 'database sql rds postgresql mysql relational db storage oracle db schema server', fields: 'rds' },
      { id: 'dynamodb', name: 'DynamoDB NoSQL database', tags: 'nosql database tables keyvalue serverless ddb db wcu rcu document indexing', fields: 'generic', unit: 'Capacity Units', defaultRate: 0.00065 },
      { id: 'redshift', name: 'Redshift Data Warehouse', tags: 'analytics warehouse query relational database sql db redshift analytics data warehouse bigdata cluster', fields: 'generic', unit: 'Node Hours', defaultRate: 0.2500 },
      { id: 'elasticache', name: 'ElastiCache (Redis / Memcached)', tags: 'redis memcached cache inmemory database database memory acceleration speed db performance', fields: 'generic', unit: 'Node Hours', defaultRate: 0.0220 },
    ]
  },
  {
    category: 'Networking & Content Delivery',
    icon: Activity,
    services: [
      { id: 'vpc', name: 'Amazon VPC Network Routing', tags: 'virtual private cloud network subnet internet gateway route connections ip vpn gateway transit', fields: 'generic', unit: 'GB-Data', defaultRate: 0.0100 },
      { id: 'cloudfront', name: 'CloudFront CDN distribution', tags: 'cdn routing edge global edge cache caching files static transfer bandwidth latency speed', fields: 'generic', unit: 'GB-Transferred', defaultRate: 0.0850 },
      { id: 'api-gateway', name: 'API Gateway Management', tags: 'rest http api serverless endpoint routes backend web call gateway endpoint cors', fields: 'generic', unit: 'Million Requests', defaultRate: 3.5000 },
      { id: 'route53', name: 'Route 53 DNS Resolver', tags: 'dns route traffic domain names zone record network route53 latency hosting', fields: 'generic', unit: 'Hosted Zones', defaultRate: 0.5000 },
      { id: 'elb', name: 'Load Balancer (ALB / NLB)', tags: 'load balancer alb nlb traffic routing scale networking ec2 group listener elastic proxy', fields: 'generic', unit: 'LCU Hours', defaultRate: 0.0252 },
    ]
  },
  {
    category: 'Security, Identity & Compliance',
    icon: Shield,
    services: [
      { id: 'iam', name: 'IAM Access Rights Policy', tags: 'security policy user access permissions policies roles certificates identity credentials groups accesskey MFA', fields: 'generic', unit: 'Active Users', defaultRate: 0.0000 },
      { id: 'kms', name: 'KMS Key Cryptography', tags: 'encryption keys security secrets encrypt decrypt kms cryptography envelope key vault', fields: 'generic', unit: 'Active Keys', defaultRate: 1.0000 },
      { id: 'secretsmanager', name: 'Secrets Manager Vault', tags: 'secrets passwords vault keys secure storage rotated credentials credentials secret key database API', fields: 'generic', unit: 'Secrets-Month', defaultRate: 0.4000 },
    ]
  },
  {
    category: 'Analytics',
    icon: BarChart,
    services: [
      { id: 'athena', name: 'Athena Serverless Queries', tags: 'serverless query raw files csv json query analytic logs data s3 glue bucket data lake Athena analytics', fields: 'generic', unit: 'GB Scanned', defaultRate: 0.0050 },
      { id: 'glue', name: 'Glue ETL Pipeline Scheduler', tags: 'etl jobs pipeline data analytics databases serverless crawler schema catalog workflow spark', fields: 'generic', unit: 'DPU Hours', defaultRate: 0.4400 },
      { id: 'emr', name: 'EMR Big Data Compute Nodes', tags: 'hadoop spark analytics cluster nodes data instances compute mapreduce spark flink', fields: 'generic', unit: 'Node Hours', defaultRate: 0.0480 },
    ]
  },
  {
    category: 'Machine Learning & AI',
    icon: Brain,
    services: [
      { id: 'sagemaker', name: 'SageMaker Studio Notebooks', tags: 'jupyter machine learning AI sagemaker model notebooks testing training deploy inference sagemaker studio pipeline', fields: 'generic', unit: 'Compute Hours', defaultRate: 0.0560 },
      { id: 'bedrock', name: 'Bedrock AI Model APIs', tags: 'llm bedrock model endpoints generative prompt AI logic gpt claude llama bedrock api token text generation', fields: 'generic', unit: 'Million Tokens', defaultRate: 15.0000 },
      { id: 'rekognition', name: 'Rekognition Video/Image recognition', tags: 'computer vision detection face scan AI target models metadata metadata label scan custom labels OCR', fields: 'generic', unit: 'Images Scanned', defaultRate: 0.0010 },
    ]
  },
  {
    category: 'Management & Governance',
    icon: Eye,
    services: [
      { id: 'cloudwatch', name: 'CloudWatch metrics & logs', tags: 'metrics alerts alarm log file logs charts analytics debug insight cloudwatch alerts dash metric agent ingestion', fields: 'generic', unit: 'GB Ingested', defaultRate: 0.3000 },
      { id: 'cloudtrail', name: 'CloudTrail Audit Streams', tags: 'audit logging logs api history tracker security event audit trace tracking compliance compliance registry activities', fields: 'generic', unit: 'Million Events', defaultRate: 2.0000 },
    ]
  }
];

const INSTANCE_SPECS = [
  { type: 't2.micro', cpu: '1 vCPU', ram: '1 GiB', price: '$0.0116/hr', desc: 'Burstable general purpose' },
  { type: 't2.small', cpu: '1 vCPU', ram: '2 GiB', price: '$0.0230/hr', desc: 'Burstable general purpose' },
  { type: 't3.micro', cpu: '2 vCPUs', ram: '1 GiB', price: '$0.0104/hr', desc: 'Next-gen burstable, cost optimized' },
];

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Cpu,
  Cloud,
  Database,
  Activity,
  Shield,
  BarChart,
  Brain,
  Eye,
  Layers
};

export const CostEstimatorView: React.FC<CostEstimatorViewProps> = ({
  onAddEstimate,
  onAddToast,
  estimates,
}) => {
  // Service Catalog selection states
  const [selectedService, setSelectedService] = useState<any>({
    id: 'ec2',
    name: 'EC2 Compute Instances',
    fields: 'ec2'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Compute');

  // Catalog loading and search navigation states
  const [catalog, setCatalog] = useState<any[]>([]);
  const [dynamicCatalogLoaded, setDynamicCatalogLoaded] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const [recentSelections, setRecentSelections] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('cloudinsight_recent_services');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cloudinsight_favorite_services');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await fetchServices();
        if (response && Array.isArray(response.data)) {
          setCatalog(response.data);
          setDynamicCatalogLoaded(true);
        }
      } catch (err) {
        console.warn('Failed to load services catalog, falling back to static catalog', err);
      }
    };
    loadCatalog();
  }, []);

  const getFlatCatalog = () => {
    if (dynamicCatalogLoaded && catalog.length > 0) {
      return catalog;
    }
    const flat: any[] = [];
    AWS_CATALOG.forEach((cat) => {
      cat.services.forEach((svc) => {
        flat.push({
          id: svc.id,
          name: svc.name,
          category: cat.category,
          fields: svc.fields,
          tier: svc.id === 'ec2' || svc.id === 'rds' || svc.id === 'ebs' || svc.id === 'ecs' || svc.id === 'eks' || svc.id === 'redshift' || svc.id === 'elasticache' || svc.id === 'fsx' ? 1 : (svc.id === 's3' || svc.id === 'lambda' || svc.id === 'dynamodb' || svc.id === 'cloudfront' || svc.id === 'api-gateway' || svc.id === 'route53' || svc.id === 'cloudwatch' ? 2 : 3),
          icon: cat.category,
          description: svc.name,
          unit: (svc as any).unit,
          defaultRate: (svc as any).defaultRate
        });
      });
    });
    return flat;
  };

  const getGroupedCatalog = () => {
    const flatList = getFlatCatalog();
    const categoriesMap: Record<string, any[]> = {};
    flatList.forEach((svc) => {
      const cat = svc.category || 'Other';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = [];
      }
      categoriesMap[cat].push(svc);
    });

    return Object.keys(categoriesMap).map((catName) => {
      const firstSvc = categoriesMap[catName][0];
      const iconComponent = ICON_MAP[firstSvc?.icon || 'Layers'] || Layers;
      return {
        category: catName,
        icon: iconComponent,
        services: categoriesMap[catName]
      };
    });
  };

  const getFilteredServices = () => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    const results: any[] = [];
    const flatList = getFlatCatalog();
    flatList.forEach((svc) => {
      const tags = `${svc.name} ${svc.id} ${svc.category} ${svc.description || ''}`.toLowerCase();
      if (tags.includes(query)) {
        results.push(svc);
      }
    });
    return results;
  };

  const getFavServices = () => {
    const flatList = getFlatCatalog();
    return flatList.filter((svc) => favorites.includes(svc.id));
  };

  const getCommonServices = () => {
    const flatList = getFlatCatalog();
    const commonIds = ['ec2', 's3', 'lambda', 'rds', 'dynamodb', 'ecs', 'eks', 'vpc', 'cloudfront', 'ebs', 'route53', 'cloudwatch'];
    return flatList.filter((svc) => commonIds.includes(svc.id));
  };

  const getDropdownOptions = () => {
    if (searchQuery) {
      return getFilteredServices();
    }
    const options: any[] = [];
    if (recentSelections.length > 0) {
      options.push(...recentSelections.map(x => ({ ...x, _group: 'Recent' })));
    }
    const favs = getFavServices();
    if (favs.length > 0) {
      options.push(...favs.map(x => ({ ...x, _group: 'Favorites' })));
    }
    const common = getCommonServices();
    options.push(...common.map(x => ({ ...x, _group: 'Common' })));
    
    // Deduplicate options if a service appears in multiple sections (e.g. EC2 in Recent and Common)
    const seenIds = new Set<string>();
    return options.filter((svc) => {
      const key = `${svc.id}-${svc._group}`;
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    });
  };

  const addToRecent = (svc: any) => {
    const updated = [svc, ...recentSelections.filter(x => x.id !== svc.id)].slice(0, 4);
    setRecentSelections(updated);
    localStorage.setItem('cloudinsight_recent_services', JSON.stringify(updated));
  };

  const toggleFavorite = (svcId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(svcId)
      ? favorites.filter(id => id !== svcId)
      : [...favorites, svcId];
    setFavorites(updated);
    localStorage.setItem('cloudinsight_favorite_services', JSON.stringify(updated));
  };

  const handleSelectService = (svc: any) => {
    setSelectedService(svc);
    setSearchQuery(svc.name);
    setShowDropdown(false);
    addToRecent(svc);

    // Seed generic parameters if selected a generic fields service
    if (svc.fields === 'generic') {
      setGenericResource('standard-resource');
      setGenericUnit(svc.unit || 'units');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setShowDropdown(true);
      }
      return;
    }

    const options = getDropdownOptions();
    if (options.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < options.length) {
        handleSelectService(options[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Input states
  const [instanceType, setInstanceType] = useState('t2.micro');
  const [hours, setHours] = useState<number>(720);
  const [storageGB, setStorageGB] = useState<number>(100);
  const [requests, setRequests] = useState<number>(1000000);
  const [gbSeconds, setGbSeconds] = useState<number>(100000);

  // RDS database configuration states
  const [rdsInstance, setRdsInstance] = useState('db.t3.micro');
  const [rdsEngine, setRdsEngine] = useState('PostgreSQL');

  // Generic capacity inputs
  const [genericResource, setGenericResource] = useState('standard-resource');
  const [genericUsage, setGenericUsage] = useState<number>(100);
  const [genericUnit, setGenericUnit] = useState('units');
  const [region, setRegion] = useState('ap-south-1');

  const [loading, setLoading] = useState(false);
  const [latestResult, setLatestResult] = useState<CostEstimationResult | null>(
    estimates.length > 0 ? estimates[0] : null
  );

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let calculatePromise;
      const type = selectedService.fields;

      if (type === 'ec2') {
        if (hours <= 0 || hours > 8760) {
          onAddToast('Please enter a valid range of hours (1 to 8760).', 'error');
          setLoading(false);
          return;
        }
        calculatePromise = calculateCost(hours, instanceType);
      } else if (type === 's3') {
        if (storageGB <= 0) {
          onAddToast('Please enter a valid storage capacity in GB.', 'error');
          setLoading(false);
          return;
        }
        calculatePromise = calculateS3Cost(storageGB);
      } else if (type === 'lambda') {
        if (requests <= 0 || gbSeconds <= 0) {
          onAddToast('Please enter valid request counts and compute parameters.', 'error');
          setLoading(false);
          return;
        }
        calculatePromise = calculateLambdaCost(requests, gbSeconds);
      } else if (type === 'rds') {
        if (hours <= 0 || hours > 8760) {
          onAddToast('Please enter a valid range of hours (1 to 8760).', 'error');
          setLoading(false);
          return;
        }
        calculatePromise = calculateRdsCost(hours, rdsInstance, rdsEngine);
      } else {
        // Generic extensible cost calculator
        if (genericUsage <= 0) {
          onAddToast('Please enter a valid usage rate amount.', 'error');
          setLoading(false);
          return;
        }
        calculatePromise = calculateGenericCost(
          selectedService.id,
          genericResource,
          genericUsage,
          genericUnit,
          region
        );
      }

      const { result, latency } = await calculatePromise;
      onAddEstimate(result);
      setLatestResult(result);
      
      if (result.isMocked) {
        onAddToast(`Calculated locally in ${latency}ms (API fallback active).`, 'warning');
      } else {
        onAddToast(`Calculated via AWS Lambda in ${latency}ms!`, 'success');
      }
    } catch (err) {
      onAddToast('Error running cost estimation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHoursPreset = (amount: number) => {
    setHours(amount);
  };

  const copyResultText = latestResult
    ? latestResult.supported === false
      ? `AWS Cost Estimate (CloudInsight Lite):\n` +
        `- Service: ${latestResult.service?.toUpperCase()}\n` +
        `- Status: Unsupported\n` +
        `- Message: ${latestResult.message || 'Pricing engine coming soon.'}`
      : latestResult.service === 's3'
      ? `AWS S3 Cost Estimate (CloudInsight Lite):\n` +
        `- Storage Size: ${latestResult.storageGB} GB\n` +
        `- Estimated Monthly Cost: $${latestResult.estimatedMonthlyCost.toFixed(4)}\n` +
        `- Estimated Annual Cost: $${latestResult.estimatedAnnualCost.toFixed(4)}\n` +
        `- Suggested Lifecycle Savings: -$${latestResult.suggestedSavings.toFixed(4)}/mo`
      : latestResult.service === 'lambda'
      ? `AWS Lambda Cost Estimate (CloudInsight Lite):\n` +
        `- Requests Volume: ${latestResult.requests} invocations\n` +
        `- Compute Allocation: ${latestResult.gbSeconds} GB-Seconds\n` +
        `- Estimated Monthly Cost: $${latestResult.estimatedMonthlyCost.toFixed(6)}\n` +
        `- Estimated Annual Cost: $${latestResult.estimatedAnnualCost.toFixed(6)}\n` +
        `- Suggested Optimization Savings: -$${latestResult.suggestedSavings.toFixed(6)}/mo`
      : `AWS Cost Estimate (CloudInsight Lite):\n` +
        `- Instance Type: ${latestResult.instanceType}\n` +
        `- Duration: ${latestResult.hours} hours\n` +
        `- Estimated Monthly Cost: $${latestResult.estimatedMonthlyCost.toFixed(2)}\n` +
        `- Estimated Annual Cost: $${latestResult.estimatedAnnualCost.toFixed(2)}\n` +
        `- Suggested Savings Plan Option: -$${latestResult.suggestedSavings.toFixed(2)}/mo`
    : '';



  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">AWS Service Catalog Explorer</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Browse our expandable catalog of 200+ AWS services, search by typing features, and estimate billing impact dynamically.
          </p>
        </div>
        {estimates.length > 0 && (
          <div className="flex items-center gap-2 font-semibold">
            <button
              onClick={() => exportCostHistoryCSV(estimates)}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={() => exportCostHistoryPDF(estimates)}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Service Catalog UI & Dynamic inputs (Left column) */}
        <div className="space-y-6">
          
          {/* 1. Autocomplete Search input */}
          <div className="border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs relative" ref={dropdownRef}>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-2">
              Type-to-Search AWS Service
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search services (e.g. lambda, S3, database...)"
                className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            </div>

            {/* Suggestions dropdown card */}
            {showDropdown && getDropdownOptions().length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                {getDropdownOptions().map((svc, idx) => {
                  const isFocused = idx === focusedIndex;
                  const isFav = favorites.includes(svc.id);
                  return (
                    <div
                      key={`${svc.id}-${idx}`}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      onClick={() => handleSelectService(svc)}
                      className={`w-full text-left px-4 py-2.5 text-xs flex justify-between items-center cursor-pointer transition-colors ${
                        isFocused 
                          ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white' 
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 max-w-[65%]">
                        <span className="font-semibold truncate">{svc.name}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-550 truncate">{svc.description || svc.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {svc._group && (
                          <span className="text-[8px] uppercase tracking-wider font-semibold text-zinc-405 dark:text-zinc-550 bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono">
                            {svc._group}
                          </span>
                        )}
                        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded font-medium">
                          {svc.category}
                        </span>
                        <button
                          onClick={(e) => toggleFavorite(svc.id, e)}
                          className={`p-1 hover:text-amber-500 transition-colors text-xs ${
                            isFav ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-650'
                          }`}
                          title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                        >
                          ★
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Categorized Catalog Browser */}
          <div className="border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-950 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" /> Service Categories
            </h3>
            
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {getGroupedCatalog().map((cat) => {
                const CatIcon = cat.icon;
                const isExpanded = expandedCategory === cat.category;
                return (
                  <div key={cat.category} className="border border-zinc-100 dark:border-zinc-800/50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                      className="w-full flex justify-between items-center p-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 dark:bg-zinc-955/20 dark:hover:bg-zinc-955/40 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <CatIcon className="w-3.5 h-3.5 text-linear dark:text-aws" />
                        {cat.category}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    
                    {isExpanded && (
                      <div className="p-2 bg-white dark:bg-zinc-900 divide-y divide-zinc-50 dark:divide-zinc-800/40">
                        {cat.services.map((svc) => (
                          <button
                            key={svc.id}
                            onClick={() => handleSelectService(svc)}
                            className={`w-full text-left p-2.5 text-[11px] rounded-md transition-colors cursor-pointer block ${
                              selectedService.id === svc.id
                                ? 'bg-linear/5 dark:bg-aws/5 text-linear dark:text-aws font-semibold'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50/40 dark:hover:bg-zinc-955/30'
                            }`}
                          >
                            {svc.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Estimator Parameters Form */}
          <div className="border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" /> Estimator Inputs
            </h3>
            
            <div className="mb-4 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/60 text-xs flex justify-between items-center">
              <span className="text-zinc-400 dark:text-zinc-500 font-medium">Selected Service:</span>
              <span className="font-bold text-zinc-800 dark:text-white">{selectedService.name}</span>
            </div>

            <form onSubmit={handleCalculate} className="space-y-4">
              
              {/* Conditional Input Parameters based on Selected Service */}
              {selectedService.fields === 'ec2' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="instance-type" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Instance Type
                    </label>
                    <select
                      id="instance-type"
                      value={instanceType}
                      onChange={(e) => setInstanceType(e.target.value)}
                      className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all cursor-pointer"
                    >
                      <option value="t2.micro">t2.micro ($0.0116/hr)</option>
                      <option value="t2.small">t2.small ($0.0230/hr)</option>
                      <option value="t3.micro">t3.micro ($0.0104/hr)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="usage-hours" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        Usage Hours
                      </label>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Max: 8760</span>
                    </div>
                    <input
                      id="usage-hours"
                      type="number"
                      min="1"
                      max="8760"
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
                      placeholder="720"
                      required
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => handleHoursPreset(168)}
                        className="text-[9px] font-medium px-2 py-0.5 rounded bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                      >
                        1 Week (168h)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHoursPreset(720)}
                        className="text-[9px] font-medium px-2 py-0.5 rounded bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                      >
                        1 Month (720h)
                      </button>
                    </div>
                  </div>
                </>
              )}

              {selectedService.fields === 's3' && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="storage-gb" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Storage Capacity (GB)
                  </label>
                  <input
                    id="storage-gb"
                    type="number"
                    min="1"
                    value={storageGB}
                    onChange={(e) => setStorageGB(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
                    placeholder="100"
                    required
                  />
                </div>
              )}

              {selectedService.fields === 'lambda' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lambda-requests" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Requests Volume
                    </label>
                    <input
                      id="lambda-requests"
                      type="number"
                      min="1"
                      value={requests}
                      onChange={(e) => setRequests(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
                      placeholder="1000000"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lambda-gbsec" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Compute (GB-Seconds)
                    </label>
                    <input
                      id="lambda-gbsec"
                      type="number"
                      min="1"
                      value={gbSeconds}
                      onChange={(e) => setGbSeconds(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
                      placeholder="100000"
                      required
                    />
                  </div>
                </>
              )}

              {selectedService.fields === 'rds' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="rds-instance" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      RDS Instance Class
                    </label>
                    <select
                      id="rds-instance"
                      value={rdsInstance}
                      onChange={(e) => setRdsInstance(e.target.value)}
                      className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all cursor-pointer"
                    >
                      <option value="db.t3.micro">db.t3.micro ($0.018/hr)</option>
                      <option value="db.t3.small">db.t3.small ($0.036/hr)</option>
                      <option value="db.t2.micro">db.t2.micro ($0.017/hr)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="rds-engine" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Database Engine
                    </label>
                    <select
                      id="rds-engine"
                      value={rdsEngine}
                      onChange={(e) => setRdsEngine(e.target.value)}
                      className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all cursor-pointer"
                    >
                      <option value="PostgreSQL">PostgreSQL</option>
                      <option value="MySQL">MySQL</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="rds-hours" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Runtime Hours
                    </label>
                    <input
                      id="rds-hours"
                      type="number"
                      min="1"
                      max="8760"
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
                      placeholder="720"
                      required
                    />
                  </div>
                </>
              )}

              {selectedService.fields === 'generic' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="generic-res" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Resource Descriptor / Usage Type
                    </label>
                    <input
                      id="generic-res"
                      type="text"
                      value={genericResource}
                      onChange={(e) => setGenericResource(e.target.value)}
                      className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
                      placeholder="standard-resource"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="generic-usage" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Usage Rate ({selectedService.unit || 'units'})
                    </label>
                    <input
                      id="generic-usage"
                      type="number"
                      min="1"
                      value={genericUsage}
                      onChange={(e) => setGenericUsage(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
                      placeholder="100"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="generic-region" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Target AWS Region
                    </label>
                    <select
                      id="generic-region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all cursor-pointer"
                    >
                      <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                      <option value="us-east-1">us-east-1 (N. Virginia)</option>
                      <option value="us-west-2">us-west-2 (Oregon)</option>
                      <option value="eu-west-1">eu-west-1 (Ireland)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Submit calculations */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-xs font-medium text-white bg-linear hover:bg-linear-hover dark:bg-aws dark:hover:bg-aws-hover rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" /> Calculating...
                  </>
                ) : (
                  'Calculate Cost'
                )}
              </button>
            </form>

            {/* Catalog Specs Sheets */}
            {selectedService.id === 'ec2' && (
              <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-955 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" /> Instance Catalog Specs
                </h4>
                <div className="space-y-3">
                  {INSTANCE_SPECS.map((spec) => (
                    <div
                      key={spec.type}
                      className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 ${
                        instanceType === spec.type
                          ? 'border-linear/40 dark:border-aws/40 bg-linear/5 dark:bg-aws/5'
                          : 'border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/20 dark:bg-zinc-950/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-zinc-900 dark:text-white">{spec.type}</span>
                        <span className="font-mono text-zinc-500 dark:text-zinc-400 font-bold">{spec.price}</span>
                      </div>
                      <div className="flex gap-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                        <span>{spec.cpu}</span>
                        <span>•</span>
                        <span>{spec.ram}</span>
                        <span>•</span>
                        <span className="truncate">{spec.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedService.id === 's3' && (
              <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-955 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" /> S3 Standard Pricing Info
                </h4>
                <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5">
                  <p>Standard Tier Rate: <span className="font-bold text-zinc-900 dark:text-white">$0.023 / GB-month</span></p>
                  <p className="text-[10px]">Calculated based on standard storage tiers mapped by the billing gateway API.</p>
                </div>
              </div>
            )}

            {selectedService.id === 'lambda' && (
              <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-955 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" /> Lambda Pricing Specs
                </h4>
                <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">Requests cost:</p>
                    <p>$0.20 per million requests</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">Compute seconds cost:</p>
                    <p>$0.0000166667 per GB-second</p>
                  </div>
                </div>
              </div>
            )}

            {selectedService.id === 'rds' && (
              <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-955 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" /> RDS Engine Pricing Info
                </h4>
                <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5">
                  <p>Standard Tier Engine Rates:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[10px]">
                    <li>db.t3.micro: $0.0180/hr</li>
                    <li>db.t3.small: $0.0360/hr</li>
                    <li>db.t2.micro: $0.0170/hr</li>
                  </ul>
                </div>
              </div>
            )}

            {selectedService.fields === 'generic' && (
              <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-955 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" /> {selectedService.name} Specs
                </h4>
                <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5">
                  <p>Standard Unit Rate: <span className="font-bold text-zinc-900 dark:text-white">${selectedService.defaultRate} / {selectedService.unit}</span></p>
                  <p className="text-[10px]">Fuzzy matched usage filters resolved by the AWS Cloud cost engine.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estimation Results Panel (Right column, 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs space-y-6 animate-pulse">
              <div className="flex justify-between items-center pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="space-y-2">
                  <div className="h-2 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-5 w-64 bg-zinc-300 dark:bg-zinc-700 rounded" />
                </div>
                <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-5 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl space-y-3">
                    <div className="h-2.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-7 w-20 bg-zinc-300 dark:bg-zinc-700 rounded" />
                    <div className="h-2 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                  </div>
                ))}
              </div>

              <div className="p-4 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
                <div className="space-y-2.5 flex-1">
                  <div className="h-3 w-48 bg-zinc-300 dark:bg-zinc-700 rounded" />
                  <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-2.5 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ) : latestResult ? (
            <div className="space-y-6">
              <ResultCard
                title="Cost Calculations & Optimization recommendations"
                isMocked={latestResult.isMocked}
                copyText={copyResultText}
              >
                {latestResult.supported === false ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800/80 rounded-xl gap-3.5 py-12 text-center">
                    <div className="p-3 bg-amber-50 dark:bg-amber-955/20 text-amber-500 rounded-full border border-amber-100 dark:border-amber-900/30">
                      <Info className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Pricing Engine Coming Soon</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                        {latestResult.message || "This AWS service is not yet fully configured in our calculation engine."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Monthly card */}
                      <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Estimated Monthly Cost</span>
                        <span className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
                          ${latestResult.service === 'lambda' 
                            ? latestResult.estimatedMonthlyCost.toFixed(6) 
                            : latestResult.service === 's3'
                            ? latestResult.estimatedMonthlyCost.toFixed(4)
                            : latestResult.estimatedMonthlyCost.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {latestResult.service === 's3' 
                            ? `${latestResult.storageGB || 0} GB Standard` 
                            : latestResult.service === 'lambda'
                            ? `${(latestResult.requests || 0).toLocaleString()} runs`
                            : `Based on ${latestResult.hours} hours`}
                        </span>
                      </div>

                      {/* Suggested Savings */}
                      <div className="p-5 bg-emerald-50/40 dark:bg-emerald-955/15 border border-emerald-100/80 dark:border-emerald-900/20 rounded-xl flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" /> Suggested Savings
                        </span>
                        <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                          -${latestResult.service === 'lambda' 
                            ? latestResult.suggestedSavings.toFixed(6) 
                            : latestResult.service === 's3'
                            ? latestResult.suggestedSavings.toFixed(4)
                            : latestResult.suggestedSavings.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-500 font-medium">Optimization strategy savings</span>
                      </div>

                      {/* Estimated Annual Cost */}
                      <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Estimated Annual Runrate</span>
                        <span className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
                          ${latestResult.service === 'lambda' 
                            ? latestResult.estimatedAnnualCost.toFixed(6) 
                            : latestResult.service === 's3'
                            ? latestResult.estimatedAnnualCost.toFixed(4)
                            : latestResult.estimatedAnnualCost.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Forecasted multiplier (x12)</span>
                      </div>
                    </div>

                    {/* Savings recommendations report */}
                    <div className="mt-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 flex gap-3.5 items-start">
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500 border border-amber-100 dark:border-amber-900/30 flex-shrink-0 mt-0.5">
                        <Info className="w-4 h-4" />
                      </div>
                      <div className="text-xs space-y-1.5">
                        <p className="font-semibold text-zinc-900 dark:text-white">CloudInsight Optimization Recommendations:</p>
                        
                        {(!latestResult.service || latestResult.service === 'ec2') && (
                          <ul className="list-disc pl-4 text-zinc-500 dark:text-zinc-400 space-y-1">
                            <li>
                              Switching to <span className="font-semibold text-zinc-800 dark:text-zinc-300">t3.micro</span> could yield a savings of <span className="font-semibold text-emerald-500 font-mono">10%</span> over t2.micro, with better burst CPU capabilities.
                            </li>
                            <li>
                              For constant workloads, commit to an AWS Compute Savings Plan to reduce EC2 overhead by up to <span className="font-semibold text-emerald-500 font-mono">30%</span> (estimated savings of <span className="font-semibold font-mono">${latestResult.suggestedSavings.toFixed(2)}/mo</span>).
                            </li>
                          </ul>
                        )}

                        {latestResult.service === 's3' && (
                          <ul className="list-disc pl-4 text-zinc-500 dark:text-zinc-400 space-y-1">
                            <li>
                              Enable <span className="font-semibold text-zinc-800 dark:text-zinc-300">S3 Lifecycle Rules</span> to automatically transition aging files to Glacier Deep Archive, yielding up to <span className="font-semibold text-emerald-500 font-mono">75%</span> cost reduction.
                            </li>
                            <li>
                              Identify and abort incomplete multipart uploads to prevent garbage data overhead charges.
                            </li>
                          </ul>
                        )}

                        {latestResult.service === 'lambda' && (
                          <ul className="list-disc pl-4 text-zinc-500 dark:text-zinc-400 space-y-1">
                            <li>
                              Deploy functions to <span className="font-semibold text-zinc-800 dark:text-zinc-300">AWS Graviton2 (ARM64)</span> processors to reduce execution charge rates by up to <span className="font-semibold text-emerald-500 font-mono">20%</span>.
                            </li>
                            <li>
                              Verify execution duration traces. Right-sizing RAM configuration prevents expensive runtime durations.
                            </li>
                          </ul>
                        )}

                        {['ec2', 's3', 'lambda'].indexOf(latestResult.service || 'ec2') === -1 && (
                          <ul className="list-disc pl-4 text-zinc-500 dark:text-zinc-400 space-y-1">
                            <li>
                              Consolidate unused resources. Turn off development or testing nodes of <span className="font-semibold text-zinc-800 dark:text-zinc-300">{latestResult.service?.toUpperCase()}</span> during off-peak hours.
                            </li>
                            <li>
                              Review cloud metrics dynamically to detect high scaling parameters or resource bottlenecks.
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </ResultCard>

              {/* Estimation History Table */}
              {estimates.length > 1 && (
                <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Calculation History</h4>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                    {estimates.slice(0, 4).map((est) => (
                      <div key={est.id} className="p-4 flex justify-between items-center hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 transition-colors">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            {est.service === 's3' 
                              ? 'S3 Storage Standard' 
                              : est.service === 'lambda' 
                              ? 'Lambda Invocations' 
                              : est.service === 'rds'
                              ? `RDS: ${est.instanceType}`
                              : est.service
                              ? `${est.service.toUpperCase()}: ${est.instanceType}`
                              : `Instance: ${est.instanceType}`}
                          </span>
                          <span className="text-zinc-400 dark:text-zinc-500">
                            {est.service === 's3' 
                              ? `${est.storageGB || 0} GB storage` 
                              : est.service === 'lambda'
                              ? `${(est.requests || 0).toLocaleString()} requests`
                              : `${est.hours || 720} hours estimated`}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-zinc-900 dark:text-white block font-mono">
                            {est.supported === false 
                              ? 'Unsupported' 
                              : `$${est.service === 'lambda' 
                                  ? est.estimatedMonthlyCost.toFixed(6) 
                                  : est.service === 's3'
                                  ? est.estimatedMonthlyCost.toFixed(4)
                                  : est.estimatedMonthlyCost.toFixed(2)}/mo`}
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                            {new Date(est.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="Select an AWS service and calculate cost"
              description="Choose any categorized AWS service or type to search, then provide capacity parameters on the left to estimate."
              actionLabel="Reset to Default EC2"
              onAction={() => handleSelectService({ id: 'ec2', name: 'EC2 Compute Instances', fields: 'ec2' })}
              icon="cost"
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default CostEstimatorView;
