type Job={id:string;title:string;company:string;location:string;type:string;stipend:string;description:string;skills:string};
export default function JobCard({job,onApply}:{job:Job;onApply:(id:string)=>void}){
 return <article className="job-card">
   <div className="job-top"><div><h3>{job.title}</h3><p className="company">{job.company}</p></div><span className="badge">{job.type}</span></div>
   <p>{job.description}</p>
   <div className="meta"><span>📍 {job.location}</span><span>💰 {job.stipend}</span></div>
   <div className="skills">{job.skills.split(',').map(s=><span key={s}>{s.trim()}</span>)}</div>
   <button onClick={()=>onApply(job.id)}>Apply Now</button>
 </article>
}
