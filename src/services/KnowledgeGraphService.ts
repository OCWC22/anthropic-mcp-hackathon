import neo4j, { Driver, Session, Transaction, ManagedTransaction } from 'neo4j-driver';

export interface Node {
  id: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
  properties: Record<string, unknown>;
}

export class KnowledgeGraphService {
  private driver: Driver;
  
  constructor(uri: string, username: string, password: string) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  async addNode(node: Node): Promise<void> {
    const session = this.driver.session();
    try {
      await session.executeWrite(async (tx: ManagedTransaction) =>
        tx.run(
          `
          CREATE (n:${node.type} {id: $id})
          SET n += $properties
          RETURN n
          `,
          {
            id: node.id,
            properties: node.properties
          }
        )
      );
    } catch (error) {
      throw new Error(`Failed to add node: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await session.close();
    }
  }

  async addRelationship(relationship: Relationship): Promise<void> {
    const session = this.driver.session();
    try {
      await session.executeWrite(async (tx: ManagedTransaction) =>
        tx.run(
          `
          MATCH (from {id: $fromId})
          MATCH (to {id: $toId})
          CREATE (from)-[r:${relationship.type}]->(to)
          SET r += $properties
          RETURN r
          `,
          {
            fromId: relationship.from,
            toId: relationship.to,
            properties: relationship.properties
          }
        )
      );
    } catch (error) {
      throw new Error(`Failed to add relationship: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await session.close();
    }
  }

  async findRelatedNodes(nodeId: string, relationship: string): Promise<Record<string, unknown>[]> {
    const session = this.driver.session();
    try {
      const result = await session.executeRead(async (tx: ManagedTransaction) =>
        tx.run(
          `
          MATCH (n {id: $nodeId})-[r:${relationship}]->(related)
          RETURN related
          `,
          { nodeId }
        )
      );
      return result.records.map(record => record.get('related').properties);
    } catch (error) {
      throw new Error(`Failed to find related nodes: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await session.close();
    }
  }

  async close(): Promise<void> {
    await this.driver.close();
  }
} 