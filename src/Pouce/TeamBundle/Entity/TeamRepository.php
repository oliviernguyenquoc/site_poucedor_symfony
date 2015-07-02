<?php

namespace Pouce\TeamBundle\Entity;

use Doctrine\ORM\EntityRepository;

/**
 * TeamRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class TeamRepository extends EntityRepository
{
	
	public function getLastTeam($idUser)    
	{
	        $qb = $this -> createQueryBuilder('t')
	                    -> leftJoin('t.users','u', 'WITH', 'u.id = :idUser')
	                    -> setParameter('idUser', $idUser)
	                    -> orderBy('u.created','DESC')
                        ->setMaxResults(1)
	             ;
	        return $qb->getQuery()->getSingleResult() ;    
    	}

}
