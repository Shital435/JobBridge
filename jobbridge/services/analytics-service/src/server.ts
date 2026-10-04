import { Kafka } from 'kafkajs';
const kafka=new Kafka({clientId:'analytics-service',brokers:[process.env.KAFKA_BROKER||'kafka:9092']});
const consumer=kafka.consumer({groupId:'analytics-group'});
let totalApplications=0;
async function main(){
  await consumer.connect();
  await consumer.subscribe({topic:'application.created',fromBeginning:true});
  await consumer.run({eachMessage:async({message})=>{
    totalApplications++;
    const data=JSON.parse(message.value?.toString()||'{}');
    console.log(`📊 Analytics: application ${data.applicationId} received. Total events: ${totalApplications}`);
  }});
}
main().catch(console.error);
